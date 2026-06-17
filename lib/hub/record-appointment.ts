import { prisma } from '@/lib/prisma'
import { ingestEvent } from './ingest-event'
import { cleanString, normalizeStage } from './normalizers'
import { syncContactToNotion } from '@/lib/notion/sync-contact'
import { captureException } from '@/lib/error-tracking'
import { logger } from '@/lib/logger'

export async function recordAppointment(input: {
  inquiryId?: string | null
  leadSessionId?: string | null
  gcalId?: string | null
  scheduledFor?: string | Date | null
  endAt?: string | Date | null
  bookingSource?: string | null
  source?: string | null
  medium?: string | null
  campaign?: string | null
  status?: string | null
  location?: string | null
}) {
  const inquiry = input.inquiryId
    ? await prisma.inquiry.findUnique({ where: { id: input.inquiryId }, include: { contact: true } })
    : await prisma.inquiry.findFirst({
        where: { leadSessionId: cleanString(input.leadSessionId, 191) ?? undefined },
        orderBy: { createdAt: 'desc' },
        include: { contact: true },
      })

  if (!inquiry) throw new Error('No matching inquiry')

  const bookingSource = cleanString(input.bookingSource, 100) ?? 'booking_webhook'
  const toStage = normalizeStage('Booked')

  let appointment: Awaited<ReturnType<typeof prisma.appointment.create>>

  try {
    // A booking touches four records (appointment, inquiry stage, follow-up
    // task, communication log) that must land together — a webhook retry or
    // crash between writes would otherwise leave the lead's pipeline state
    // and appointment out of sync.
    const result = await prisma.$transaction(async (tx) => {
      const createdAppointment = await tx.appointment.create({
        data: {
          contactId: inquiry.contactId,
          inquiryId: inquiry.id,
          bookingSource,
          source: cleanString(input.source, 100) ?? inquiry.source ?? undefined,
          medium: cleanString(input.medium, 100) ?? inquiry.medium ?? undefined,
          campaign: cleanString(input.campaign, 150) ?? inquiry.campaign ?? undefined,
          scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : undefined,
          status: cleanString(input.status, 100) ?? 'Booked',
          location: cleanString(input.location, 250) ?? undefined,
        },
      })

      // Booking is an objective real-world event (the lead scheduled a call),
      // so it advances the pipeline regardless of how thoroughly the lead was
      // qualified beforehand — bypass the normal forward-transition gate.
      await tx.inquiry.update({
        where: { id: inquiry.id },
        data: { stage: toStage },
      })

      await tx.inquiryStageHistory.create({
        data: {
          inquiryId: inquiry.id,
          fromStage: inquiry.stage,
          toStage,
          actor: bookingSource,
          note: 'Stage advanced by appointment booking',
        },
      })

      await tx.task.updateMany({
        where: { inquiryId: inquiry.id, status: { not: 'Done' } },
        data: { status: 'Done' },
      })

      await tx.note.create({
        data: {
          inquiryId: inquiry.id,
          contactId: inquiry.contactId,
          title: 'Appointment booked',
          body: `Booked via ${bookingSource}${createdAppointment.scheduledFor ? ` for ${createdAppointment.scheduledFor.toISOString()}` : ''}.`,
          author: bookingSource,
        },
      })

      return createdAppointment
    })

    appointment = result
  } catch (err) {
    await captureException(err, {
      source: 'booking',
      inquiryId: inquiry.id,
      contactId: inquiry.contactId,
    })
    throw err
  }

  await ingestEvent({
    eventType: 'stage_changed',
    occurredAt: new Date(),
    inquiryId: inquiry.id,
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
      actor: bookingSource,
    },
  })

  await ingestEvent({
    eventType: 'appointment_booked',
    occurredAt: input.scheduledFor ? new Date(input.scheduledFor) : new Date(),
    contactId: inquiry.contactId,
    inquiryId: inquiry.id,
    leadSessionId: inquiry.leadSessionId,
    pageUrl: inquiry.landingPage,
    source: cleanString(input.source, 100) ?? inquiry.source ?? undefined,
    medium: cleanString(input.medium, 100) ?? inquiry.medium ?? undefined,
    campaign: cleanString(input.campaign, 150) ?? inquiry.campaign ?? undefined,
    county: inquiry.county ?? inquiry.contact?.county ?? undefined,
    productInterest: inquiry.productInterest,
    metadata: {
      appointmentId: appointment.id,
      gcalId: cleanString(input.gcalId, 200),
      status: appointment.status,
      scheduledFor: appointment.scheduledFor,
    },
  })

  // Fire-and-forget — Notion sync must not block or break booking confirmation
  syncContactToNotion(inquiry.contact, { ...inquiry, stage: toStage }).catch(err =>
    logger.error({ err, contactId: inquiry.contactId }, 'Notion sync failed'),
  )

  return { inquiry, appointment }
}
