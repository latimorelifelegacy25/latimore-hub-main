import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { cleanString, normalizeCampaign, normalizePhone, normalizeProductInterest } from './normalizers'
import { syncContactToNotion } from '@/lib/notion/sync-contact'
import { logger } from '@/lib/logger'
import { updateLeadScores } from '@/lib/hub/lead-score'
import type { Prisma } from '@prisma/client'

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

  if (!email && !phone) {
    throw new Error('Lead must include at least an email or phone number')
  }

  async function writeLead() {
    return prisma.$transaction(async (tx) => {
    const [emailContact, phoneContact] = await Promise.all([
      email ? tx.contact.findUnique({ where: { email } }) : Promise.resolve(null),
      phone ? tx.contact.findUnique({ where: { phone } }) : Promise.resolve(null),
    ])

    const existing = emailContact ?? phoneContact
    const deduped = Boolean(existing)
    const canSetEmail = Boolean(email) && (!emailContact || emailContact.id === existing?.id)
    const canSetPhone = Boolean(phone) && (!phoneContact || phoneContact.id === existing?.id)

    const contact = existing
      ? await tx.contact.update({
          where: { id: existing.id },
          data: {
            firstName: firstName ?? existing.firstName ?? undefined,
            lastName: lastName ?? existing.lastName ?? undefined,
            email: canSetEmail ? email : undefined,
            phone: canSetPhone ? phone : undefined,
            county: county ?? existing.county ?? undefined,
            primarySource: existing.primarySource ?? source ?? undefined,
            primaryMedium: existing.primaryMedium ?? medium ?? undefined,
            primaryCampaign: existing.primaryCampaign ?? campaign ?? undefined,
          },
        })
      : await tx.contact.create({
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

    const originalInquiry = await tx.inquiry.findFirst({
      where: { contactId: contact.id },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    })
    const originalInquiryId = originalInquiry?.id ?? null

    if (leadSessionId) {
      const update: Prisma.LeadSessionUncheckedUpdateInput = {
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
      }
      const create: Prisma.LeadSessionUncheckedCreateInput = {
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
      }

      try {
        await tx.leadSession.upsert({ where: { id: leadSessionId }, update, create })
      } catch (err: any) {
        if (err?.code !== 'P2002') throw err
        await tx.leadSession.update({ where: { id: leadSessionId }, data: update })
      }
    }

    const inquiry = await tx.inquiry.create({
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

    await tx.task.create({
      data: {
        title: `Follow up with ${[contact.firstName, contact.lastName].filter(Boolean).join(' ') || contact.email || contact.phone || 'new lead'}`,
        dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        inquiryId: inquiry.id,
        contactId: contact.id,
      },
    })

    const event = await tx.event.create({
      data: {
        eventType: 'form_submit',
        leadSessionId: leadSessionId ?? undefined,
        contactId: contact.id,
        inquiryId: inquiry.id,
        pageUrl: landingPage ?? undefined,
        referrer: referrer ?? undefined,
        source: source ?? undefined,
        medium: medium ?? undefined,
        campaign: campaign ?? undefined,
        county: county ?? undefined,
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
        } as Prisma.InputJsonValue,
      },
    })

    const score = await updateLeadScores({ contact, inquiry, eventCount: 1, prisma: tx })

    await tx.systemEvent.create({
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
          skippedConflictingEmail: Boolean(email && emailContact && emailContact.id !== contact.id),
          skippedConflictingPhone: Boolean(phone && phoneContact && phoneContact.id !== contact.id),
        },
      },
    })

    if (deduped) {
      await tx.systemEvent.create({
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

    return { contact: { ...contact, leadScore: score }, inquiry: { ...inquiry, leadScore: score, deduped }, score, deduped }
    })
  }

  let result: Awaited<ReturnType<typeof writeLead>> | null = null
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      result = await writeLead()
      break
    } catch (err: any) {
      if (err?.code !== 'P2002' || attempt === 2) throw err
    }
  }

  if (!result) throw new Error('Lead upsert failed')

  // Fire-and-forget — Notion sync must not block or break lead capture
  syncContactToNotion(result.contact, result.inquiry).catch(err =>
    logger.error({ err, contactId: result.contact.id }, 'Notion sync failed'),
  )

  return result
}
