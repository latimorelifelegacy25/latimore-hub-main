import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { ingestEvent, upsertLeadSession } from './ingest-event'
import { cleanString, normalizeCampaign, normalizePhone, normalizeProductInterest } from './normalizers'
import { syncContactToNotion } from '@/lib/notion/sync-contact'
import { logger } from '@/lib/logger'
import { updateLeadScores } from '@/lib/hub/lead-score'

export type LeadUpsertInput = {
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  phone?: string | null
  county?: string | null
  productInterest?: string | null
  leadSessionId?: string | null
  source?: string | null
  medium?: string | null
  campaign?: string | null
  term?: string | null
  content?: string | null
  utmTerm?: string | null
  utmContent?: string | null
  referrer?: string | null
  landingPage?: string | null
  notes?: string | null
  metadata?: Record<string, unknown> | null
}

export async function upsertLead(input: LeadUpsertInput) {
  const correlationId = crypto.randomUUID()
  logger.info({ correlationId, stage: 'lead_received', source: input.source, medium: input.medium }, 'lead lifecycle')

  const email = cleanString(input.email, 191)?.toLowerCase() ?? null
  const rawPhone = cleanString(input.phone, 40)
  const phone = normalizePhone(input.phone) ?? rawPhone
  const firstName = cleanString(input.firstName, 100)
  const lastName = cleanString(input.lastName, 100)
  const county = cleanString(input.county, 100)
  const source = cleanString(input.source, 100)
  const medium = cleanString(input.medium, 100)
  const rawCampaign = cleanString(input.campaign, 150)
  const campaign = rawCampaign ? normalizeCampaign(rawCampaign) : null
  const utmTerm = cleanString(input.utmTerm ?? input.term, 100)
  const utmContent = cleanString(input.utmContent ?? input.content, 100)
  const referrer = cleanString(input.referrer, 500)
  const landingPage = cleanString(input.landingPage, 500)
  const leadSessionId = cleanString(input.leadSessionId, 191)
  const rawProductInterest = cleanString(input.productInterest, 100)
  const productInterest = normalizeProductInterest(input.productInterest)
  const notes = cleanString(input.notes, 2000)

  let existing = null as Awaited<ReturnType<typeof prisma.contact.findFirst>> | null
  if (email) {
    existing = await prisma.contact.findUnique({ where: { email } })
  }
  if (!existing && phone) {
    const phoneMatches = [phone, rawPhone].filter(
      (value, index, values): value is string => Boolean(value) && values.indexOf(value) === index,
    )
    existing = await prisma.contact.findFirst({ where: { OR: phoneMatches.map(value => ({ phone: value })) } })
  }
  let deduped = Boolean(existing)
  let originalInquiryId: string | null = null
  if (existing) {
    const originalInquiry = await prisma.inquiry.findFirst({
      where: { contactId: existing.id },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    })
    originalInquiryId = originalInquiry?.id ?? null
  }

  let contact: Awaited<ReturnType<typeof prisma.contact.update>>
  if (existing) {
    contact = await prisma.contact.update({
      where: { id: existing.id },
      data: {
        firstName: firstName ?? existing.firstName ?? undefined,
        lastName: lastName ?? existing.lastName ?? undefined,
        email: email ?? existing.email ?? undefined,
        phone: phone ?? existing.phone ?? undefined,
        county: county ?? existing.county ?? undefined,
        primarySource: existing.primarySource ?? source ?? undefined,
        primaryMedium: existing.primaryMedium ?? medium ?? undefined,
        primaryCampaign: existing.primaryCampaign ?? campaign ?? undefined,
      },
    })
  } else {
    try {
      contact = await prisma.contact.create({
        data: {
          email: email ?? undefined,
          firstName: firstName ?? undefined,
          lastName: lastName ?? undefined,
          phone: phone ?? undefined,
          county: county ?? undefined,
          primarySource: source ?? undefined,
          primaryMedium: medium ?? undefined,
          primaryCampaign: campaign ?? undefined,
        },
      })
    } catch (err: any) {
      // P2002 = unique constraint violation — a concurrent request created this contact first
      if (err.code === 'P2002' && email) {
        const found = await prisma.contact.findUnique({ where: { email } })
        if (!found) throw err
        deduped = true
        const originalInquiry = await prisma.inquiry.findFirst({
          where: { contactId: found.id },
          orderBy: { createdAt: 'asc' },
          select: { id: true },
        })
        originalInquiryId = originalInquiry?.id ?? null
        contact = await prisma.contact.update({
          where: { id: found.id },
          data: {
            firstName: firstName ?? found.firstName ?? undefined,
            lastName: lastName ?? found.lastName ?? undefined,
            phone: phone ?? found.phone ?? undefined,
            county: county ?? found.county ?? undefined,
            primarySource: found.primarySource ?? source ?? undefined,
            primaryMedium: found.primaryMedium ?? medium ?? undefined,
            primaryCampaign: found.primaryCampaign ?? campaign ?? undefined,
          },
        })
      } else {
        throw err
      }
    }
  }

  logger.info({ correlationId, stage: 'contact_upserted', contactId: contact.id, deduped }, 'lead lifecycle')

  if (leadSessionId) {
    await upsertLeadSession(
      leadSessionId,
      {
        lastSeenAt: new Date(),
        contactId: contact.id,
        landingPage: landingPage ?? undefined,
        referrer: referrer ?? undefined,
        source: source ?? undefined,
        medium: medium ?? undefined,
        campaign: campaign ?? undefined,
        term: utmTerm ?? undefined,
        content: utmContent ?? undefined,
        county: county ?? undefined,
        productInterest,
      },
      {
        id: leadSessionId,
        contactId: contact.id,
        landingPage: landingPage ?? undefined,
        referrer: referrer ?? undefined,
        source: source ?? undefined,
        medium: medium ?? undefined,
        campaign: campaign ?? undefined,
        term: utmTerm ?? undefined,
        content: utmContent ?? undefined,
        county: county ?? undefined,
        productInterest,
      },
    )
  }

  const recentDuplicateInquiry = await prisma.inquiry.findFirst({
    where: {
      contactId: contact.id,
      productInterest,
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      ...(source ? { source } : {}),
      ...(medium ? { medium } : {}),
      ...(campaign ? { campaign } : {}),
      ...(landingPage ? { landingPage } : {}),
    },
    orderBy: { createdAt: 'desc' },
  })

  if (recentDuplicateInquiry) {
    deduped = true
    logger.info(
      { correlationId, stage: 'duplicate_suppressed', contactId: contact.id, inquiryId: recentDuplicateInquiry.id },
      'lead lifecycle',
    )
    const event = await ingestEvent({
      eventType: 'form_submit',
      leadSessionId,
      contactId: contact.id,
      inquiryId: recentDuplicateInquiry.id,
      pageUrl: landingPage,
      referrer,
      source,
      medium,
      campaign,
      county,
      productInterest,
      metadata: {
        form: 'lead',
        duplicateSuppressed: true,
        duplicateWindowHours: 24,
        firstName,
        lastName,
        email,
        phone,
        rawPhone,
        utmTerm,
        utmContent,
        referrer,
        landingPage,
        rawProductInterest,
        rawCampaign,
        originalInquiryId: originalInquiryId ?? recentDuplicateInquiry.id,
        ...(input.metadata ?? {}),
      },
    })

    await prisma.systemEvent.create({
      data: {
        type: 'lead.duplicate_suppressed',
        contactId: contact.id,
        inquiryId: recentDuplicateInquiry.id,
        source,
        medium,
        campaign,
        payload: {
          action: 'lead.duplicate_suppressed',
          originalContactId: contact.id,
          originalInquiryId: originalInquiryId ?? recentDuplicateInquiry.id,
          duplicateWindowHours: 24,
          productInterest,
          rawProductInterest,
          rawCampaign,
          utmTerm,
          utmContent,
          referrer,
          landingPage,
          eventId: event.id,
        },
      },
    })

    const score = contact.leadScore ?? 0
    return {
      contact: { ...contact, leadScore: score },
      inquiry: { ...recentDuplicateInquiry, leadScore: score, deduped: true },
      score,
      deduped,
    }
  }

  const inquiry = await prisma.inquiry.create({
    data: {
      contactId: contact.id,
      leadSessionId: leadSessionId ?? undefined,
      productInterest,
      stage: 'New',
      source: source ?? undefined,
      medium: medium ?? undefined,
      campaign: campaign ?? undefined,
      landingPage: landingPage ?? undefined,
      county: county ?? undefined,
      notes: notes ?? undefined,
    },
  })

  logger.info({ correlationId, stage: 'inquiry_created', contactId: contact.id, inquiryId: inquiry.id }, 'lead lifecycle')

  const task = await prisma.task.create({
    data: {
      title: `Follow up with ${[contact.firstName, contact.lastName].filter(Boolean).join(' ') || contact.email || contact.phone || 'new lead'}`,
      dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      inquiryId: inquiry.id,
      contactId: contact.id,
    },
  })

  logger.info({ correlationId, stage: 'task_created', contactId: contact.id, inquiryId: inquiry.id, taskId: task.id }, 'lead lifecycle')

  const event = await ingestEvent({
    eventType: 'form_submit',
    leadSessionId,
    contactId: contact.id,
    inquiryId: inquiry.id,
    pageUrl: landingPage,
    referrer,
    source,
    medium,
    campaign,
    county,
    productInterest,
    metadata: {
      form: 'lead',
      firstName,
      lastName,
      email,
      phone,
      rawPhone,
      utmTerm,
      utmContent,
      referrer,
      landingPage,
      rawProductInterest,
      rawCampaign,
      deduped,
      originalInquiryId,
      ...(input.metadata ?? {}),
    },
  })

  const score = await updateLeadScores({ contact, inquiry, eventCount: 1, prisma })

  await prisma.systemEvent.create({
    data: {
      type: 'lead.audit.created',
      contactId: contact.id,
      inquiryId: inquiry.id,
      source,
      medium,
      campaign,
      payload: {
        action: 'lead.created',
        sourceType: inquiry.sourceType,
        intent: inquiry.intent,
        productInterest,
        rawProductInterest,
        rawCampaign,
        utmTerm,
        utmContent,
        referrer,
        landingPage,
        deduped,
        originalInquiryId,
        score,
        eventId: event.id,
      },
    },
  })

  if (deduped) {
    await prisma.systemEvent.create({
      data: {
        type: 'lead.deduped',
        contactId: contact.id,
        inquiryId: inquiry.id,
        source,
        medium,
        campaign,
        payload: {
          originalContactId: contact.id,
          originalInquiryId,
          duplicateInquiryId: inquiry.id,
          productInterest,
          rawProductInterest,
          rawCampaign,
          utmTerm,
          utmContent,
          referrer,
          landingPage,
        },
      },
    })
  }

  // Fire-and-forget — Notion sync must not block or break lead capture
  syncContactToNotion(contact, inquiry).catch(err =>
    logger.error({ err, correlationId, contactId: contact.id }, 'Notion sync failed'),
  )

  return { contact: { ...contact, leadScore: score }, inquiry: { ...inquiry, leadScore: score, deduped }, score, deduped }
}
