import { prisma } from '@/lib/prisma'
import { ingestEvent } from './ingest-event'
import { cleanString, normalizePhone, normalizeProductInterest, normalizeStage } from './normalizers'
import { captureException } from '@/lib/error-tracking'
import { upsertLead } from './upsert-lead'
import type { CalendarProvider, Prisma } from '@prisma/client'

type RecordAppointmentInput = {
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
  meetingUrl?: string | null
  timezone?: string | null
  title?: string | null
  description?: string | null
  firstName?: string | null
  lastName?: string | null
  fullName?: string | null
  email?: string | null
  phone?: string | null
  county?: string | null
  productInterest?: string | null
  landingPage?: string | null
  notes?: string | null
  rawPayload?: Record<string, unknown> | null
}

function toDate(value?: string | Date | null): Date | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date
}

function splitName(input: Pick<RecordAppointmentInput, 'firstName' | 'lastName' | 'fullName'>) {
  const explicitFirst = cleanString(input.firstName, 100)
  const explicitLast = cleanString(input.lastName, 100)
  if (explicitFirst || explicitLast) {
    return { firstName: explicitFirst, lastName: explicitLast }
  }

  const fullName = cleanString(input.fullName, 150)
  if (!fullName) return { firstName: null, lastName: null }

  const parts = fullName.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return { firstName: parts[0], lastName: null }

  return {
    firstName: parts.slice(0, -1).join(' ').slice(0, 100),
    lastName: parts.at(-1)?.slice(0, 100) ?? null,
  }
}

async function resolveInquiryForAppointment(input: RecordAppointmentInput) {
  const leadSessionId = cleanString(input.leadSessionId, 191)
  const email = cleanString(input.email, 191)?.toLowerCase() ?? null
  const rawPhone = cleanString(input.phone, 40)
  const phone = normalizePhone(input.phone) ?? rawPhone
  const source = cleanString(input.source, 100) ?? 'google_calendar'
  const medium = cleanString(input.medium, 100) ?? 'appointment_scheduling'
  const campaign = cleanString(input.campaign, 150) ?? 'google_booking'
  const county = cleanString(input.county, 100)
  const productInterest = normalizeProductInterest(input.productInterest)
  const { firstName, lastName } = splitName(input)
  const notes = cleanString(input.notes ?? input.description, 2000)

  if (input.inquiryId) {
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: input.inquiryId },
      include: { contact: true },
    })
    if (inquiry) return inquiry
  }

  if (leadSessionId) {
    const inquiry = await prisma.inquiry.findFirst({
      where: { leadSessionId },
      orderBy: { createdAt: 'desc' },
      include: { contact: true },
    })
    if (inquiry) return inquiry
  }

  const contactFilters: Prisma.ContactWhereInput[] = []
  if (email) contactFilters.push({ email })
  if (phone) contactFilters.push({ phone })

  if (contactFilters.length) {
    const contact = await prisma.contact.findFirst({
      where: { OR: contactFilters },
      orderBy: { updatedAt: 'desc' },
    })

    if (contact) {
      await prisma.contact.update({
        where: { id: contact.id },
        data: {
          firstName: firstName ?? contact.firstName ?? undefined,
          lastName: lastName ?? contact.lastName ?? undefined,
          email: email ?? contact.email ?? undefined,
          phone: phone ?? contact.phone ?? undefined,
          county: county ?? contact.county ?? undefined,
        },
      })

      const existingInquiry = await prisma.inquiry.findFirst({
        where: { contactId: contact.id },
        orderBy: { createdAt: 'desc' },
        include: { contact: true },
      })
      if (existingInquiry) return existingInquiry

      const createdInquiry = await prisma.inquiry.create({
        data: {
          contactId: contact.id,
          leadSessionId: leadSessionId ?? undefined,
          productInterest,
          stage: 'New',
          source,
          medium,
          campaign,
          county: county ?? contact.county ?? undefined,
          notes: notes ?? undefined,
        },
      })

      const hydrated = await prisma.inquiry.findUnique({
        where: { id: createdInquiry.id },
        include: { contact: true },
      })
      if (hydrated) return hydrated
    }
  }

  if (email || phone) {
    const result = await upsertLead({
      firstName,
      lastName,
      email,
      phone,
      county,
      productInterest,
      leadSessionId,
      source,
      medium,
      campaign,
      landingPage: cleanString(input.landingPage, 500) ?? '/book',
      notes,
      metadata: {
        bookingIntent: true,
        bookingSource: cleanString(input.bookingSource, 100) ?? 'google_calendar',
        gcalId: cleanString(input.gcalId, 200),
        title: cleanString(input.title, 250),
      },
    })

    const inquiry = await prisma.inquiry.findUnique({
      where: { id: result.inquiry.id },
      include: { contact: true },
    })
    if (inquiry) return inquiry
  }

  throw new Error('No matching inquiry or contact')
}

export async function recordAppointment(input: RecordAppointmentInput) {
  const inquiry = await resolveInquiryForAppointment(input)
  const bookingSource = cleanString(input.bookingSource, 100) ?? 'booking_webhook'
  const toStage = normalizeStage('Booked')
  const gcalId = cleanString(input.gcalId, 200)
  const scheduledFor = toDate(input.scheduledFor)
  const endAt = toDate(input.endAt)
  const location = cleanString(input.location ?? input.meetingUrl, 250)
  const meetingUrl = cleanString(input.meetingUrl, 500)
  const title = cleanString(input.title, 250) ?? 'Appointment booked'
  const description = cleanString(input.description ?? input.notes, 2000)
  const timezone = cleanString(input.timezone, 100)
  const status = cleanString(input.status, 100) ?? 'Booked'

  let appointment: Awaited<ReturnType<typeof prisma.appointment.create>>
  let createdAppointment = false

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existingAppointment = gcalId
        ? await tx.appointment.findFirst({ where: { calendlyEventId: gcalId } })
        : scheduledFor
          ? await tx.appointment.findFirst({
              where: {
                contactId: inquiry.contactId,
                inquiryId: inquiry.id,
                scheduledFor,
                status: { in: ['Booked', 'Confirmed'] },
              },
            })
          : null

      const appointmentData = {
        contactId: inquiry.contactId,
        inquiryId: inquiry.id,
        bookingSource,
        source: cleanString(input.source, 100) ?? inquiry.source ?? undefined,
        medium: cleanString(input.medium, 100) ?? inquiry.medium ?? undefined,
        campaign: cleanString(input.campaign, 150) ?? inquiry.campaign ?? undefined,
        scheduledFor: scheduledFor ?? undefined,
        status,
        location: location ?? undefined,
        calendlyEventId: gcalId ?? undefined,
        metadata: {
          provider: gcalId ? 'google' : 'booking_webhook',
          gcalId,
          meetingUrl,
          endAt: endAt?.toISOString() ?? null,
          timezone,
          title,
          description,
          rawPayload: input.rawPayload ?? null,
        } as Prisma.InputJsonValue,
      }

      const savedAppointment = existingAppointment
        ? await tx.appointment.update({
            where: { id: existingAppointment.id },
            data: appointmentData,
          })
        : await tx.appointment.create({ data: appointmentData })

      createdAppointment = !existingAppointment

      await tx.inquiry.update({
        where: { id: inquiry.id },
        data: {
          stage: toStage,
          status: 'BOOKED',
          intent: 'CONSULT',
        },
      })

      if (inquiry.stage !== toStage) {
        await tx.inquiryStageHistory.create({
          data: {
            inquiryId: inquiry.id,
            fromStage: inquiry.stage,
            toStage,
            actor: bookingSource,
            note: 'Stage advanced by appointment booking',
          },
        })
      }

      await tx.contact.update({
        where: { id: inquiry.contactId },
        data: {
          updatedAt: new Date(),
          status: 'BOOKED',
          currentIntent: 'CONSULT',
          primaryIntent: inquiry.contact.primaryIntent === 'UNKNOWN' ? 'CONSULT' : undefined,
        },
      })

      await tx.task.updateMany({
        where: { inquiryId: inquiry.id, status: { not: 'Done' } },
        data: { status: 'Done' },
      })

      if (createdAppointment) {
        await tx.note.create({
          data: {
            inquiryId: inquiry.id,
            contactId: inquiry.contactId,
            title: 'Appointment booked',
            body: `Booked via ${bookingSource}${scheduledFor ? ` for ${scheduledFor.toISOString()}` : ''}.`,
            author: bookingSource,
          },
        })
      }

      if (scheduledFor) {
        const provider: CalendarProvider = gcalId ? 'google' : 'manual'
        const existingCalendarEvent = gcalId
          ? await tx.calendarEvent.findFirst({ where: { provider: 'google', externalId: gcalId } })
          : await tx.calendarEvent.findFirst({ where: { appointmentId: savedAppointment.id } })

        const calendarEventData = {
          contactId: inquiry.contactId,
          inquiryId: inquiry.id,
          appointmentId: savedAppointment.id,
          provider,
          externalId: gcalId ?? undefined,
          title,
          description: description ?? undefined,
          startAt: scheduledFor,
          endAt: endAt ?? undefined,
          timezone: timezone ?? undefined,
          location: location ?? undefined,
          meetingUrl: meetingUrl ?? undefined,
          status: 'scheduled',
          payload: {
            bookingSource,
            gcalId,
            rawPayload: input.rawPayload ?? null,
          } as Prisma.InputJsonValue,
        }

        if (existingCalendarEvent) {
          await tx.calendarEvent.update({
            where: { id: existingCalendarEvent.id },
            data: calendarEventData,
          })
        } else {
          await tx.calendarEvent.create({ data: calendarEventData })
        }
      }

      return savedAppointment
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

  if (createdAppointment) {
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
      occurredAt: scheduledFor ?? new Date(),
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
        gcalId,
        status: appointment.status,
        scheduledFor: appointment.scheduledFor?.toISOString() ?? null,
      },
    })
  }

  return { inquiry, appointment, createdAppointment }
}
