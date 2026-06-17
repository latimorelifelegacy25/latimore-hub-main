import { prisma } from '@/lib/prisma'
import { cleanString, normalizeEventType, normalizeProductInterest } from './normalizers'
import type { Prisma } from '@prisma/client'

export type EventIngestInput = {
  eventType: string
  occurredAt?: string | Date | null
  leadSessionId?: string | null
  contactId?: string | null
  inquiryId?: string | null
  pageUrl?: string | null
  referrer?: string | null
  source?: string | null
  medium?: string | null
  campaign?: string | null
  county?: string | null
  productInterest?: string | null
  metadata?: Record<string, unknown> | null
}

/**
 * Upserts a LeadSession, tolerating the race where two concurrent requests
 * (e.g. a page_view event and a form submit) both attempt to create the same
 * row. Under PgBouncer transaction-mode pooling, `upsert` isn't atomic, so
 * the losing request's `create` can hit a P2002 unique constraint violation
 * on the id — fall back to `update` in that case.
 */
export async function upsertLeadSession(
  id: string,
  update: Prisma.LeadSessionUncheckedUpdateInput,
  create: Prisma.LeadSessionUncheckedCreateInput,
) {
  try {
    return await prisma.leadSession.upsert({ where: { id }, update, create })
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return prisma.leadSession.update({ where: { id }, data: update })
    }
    throw err
  }
}

export async function ingestEvent(input: EventIngestInput) {
  const leadSessionId = cleanString(input.leadSessionId, 191)
  const eventType = normalizeEventType(input.eventType)
  const parsedAt = input.occurredAt ? new Date(input.occurredAt) : null
  const occurredAt = parsedAt && !Number.isNaN(parsedAt.getTime()) ? parsedAt : new Date()

  if (leadSessionId) {
    await upsertLeadSession(
      leadSessionId,
      {
        lastSeenAt: occurredAt,
        landingPage: cleanString(input.pageUrl, 500) ?? undefined,
        referrer: cleanString(input.referrer, 500) ?? undefined,
        source: cleanString(input.source, 100) ?? undefined,
        medium: cleanString(input.medium, 100) ?? undefined,
        campaign: cleanString(input.campaign, 150) ?? undefined,
        county: cleanString(input.county, 100) ?? undefined,
        productInterest: input.productInterest ? normalizeProductInterest(input.productInterest) : undefined,
        contactId: cleanString(input.contactId, 191) ?? undefined,
      },
      {
        id: leadSessionId,
        firstSeenAt: occurredAt,
        lastSeenAt: occurredAt,
        landingPage: cleanString(input.pageUrl, 500) ?? undefined,
        referrer: cleanString(input.referrer, 500) ?? undefined,
        source: cleanString(input.source, 100) ?? undefined,
        medium: cleanString(input.medium, 100) ?? undefined,
        campaign: cleanString(input.campaign, 150) ?? undefined,
        county: cleanString(input.county, 100) ?? undefined,
        productInterest: input.productInterest ? normalizeProductInterest(input.productInterest) : undefined,
        contactId: cleanString(input.contactId, 191) ?? undefined,
      },
    )
  }

  return prisma.event.create({
    data: {
      eventType,
      occurredAt,
      leadSessionId: leadSessionId ?? undefined,
      contactId: cleanString(input.contactId, 191) ?? undefined,
      inquiryId: cleanString(input.inquiryId, 191) ?? undefined,
      pageUrl: cleanString(input.pageUrl, 500) ?? undefined,
      referrer: cleanString(input.referrer, 500) ?? undefined,
      source: cleanString(input.source, 100) ?? undefined,
      medium: cleanString(input.medium, 100) ?? undefined,
      campaign: cleanString(input.campaign, 150) ?? undefined,
      county: cleanString(input.county, 100) ?? undefined,
      productInterest: input.productInterest ? normalizeProductInterest(input.productInterest) : undefined,
      metadata: (input.metadata as Prisma.InputJsonValue) ?? undefined,
    },
  })
}
