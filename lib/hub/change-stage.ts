import { prisma } from '@/lib/prisma'
import { ingestEvent } from './ingest-event'
import { logger } from '@/lib/logger'
import { cleanString, normalizeStageStrict } from './normalizers'
import { assertTransition } from './pipeline-transitions'

export async function changeInquiryStage(input: {
  inquiryId: string
  stage: string
  notes?: string | null
  actor?: string | null
  occurredAt?: Date | string | null
  force?: boolean
}) {
  const inquiry = await prisma.inquiry.findUnique({
    where: { id: input.inquiryId },
    include: { contact: true },
  })

  if (!inquiry) throw new Error('Inquiry not found')

  const toStage = normalizeStageStrict(input.stage)

  if (!input.force) {
    assertTransition(inquiry.stage, toStage)
  }

  const note = cleanString(input.notes, 2000)
  const actor = cleanString(input.actor, 100) ?? 'system'
  const occurredAt = input.occurredAt ? new Date(input.occurredAt) : new Date()

  const updated = await prisma.$transaction(async (tx) => {
    // Guard on the stage we validated against so a concurrent change can't be
    // silently overwritten or produce a bogus history row.
    const result = await tx.inquiry.updateMany({
      where: { id: input.inquiryId, stage: inquiry.stage },
      data: {
        stage: toStage,
        notes: note ?? inquiry.notes ?? undefined,
      },
    })
    if (result.count === 0) {
      throw new Error('Inquiry stage changed concurrently; retry')
    }

    await tx.inquiryStageHistory.create({
      data: {
        inquiryId: input.inquiryId,
        fromStage: inquiry.stage,
        toStage,
        actor,
        note: note ?? undefined,
        changedAt: occurredAt,
      },
    })

    // The Notion Worker's delta sync windows on Contact.updatedAt — a stage
    // change only touches Inquiry, so bump the Contact row to get picked up.
    await tx.contact.update({
      where: { id: inquiry.contactId },
      data: { updatedAt: new Date() },
    })

    return tx.inquiry.findUniqueOrThrow({ where: { id: input.inquiryId } })
  })

  try {
    await ingestEvent({
      eventType: 'stage_changed',
      occurredAt,
      inquiryId: input.inquiryId,
      contactId: inquiry.contactId,
      leadSessionId: inquiry.leadSessionId,
      pageUrl: inquiry.landingPage,
      source: inquiry.source,
      medium: inquiry.medium,
      campaign: inquiry.campaign,
      county: inquiry.county ?? inquiry.contact?.county ?? undefined,
      productInterest: inquiry.productInterest,
      metadata: {
        fromStage: inquiry.stage,
        toStage,
        actor,
        note,
      },
    })
  } catch (err) {
    logger.warn(
      { err: err instanceof Error ? err.message : String(err), inquiryId: input.inquiryId, contactId: inquiry.contactId },
      'stage_changed event failed after stage update',
    )
  }

  return updated
}
