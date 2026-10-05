import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { verifyJoinBookingToken } from '@/lib/join-booking-token'
import { BOOKING_CONFIG } from '@/lib/booking/config'
import { loadOfferedAvailability } from '@/lib/calendar/slots'
import { createGoogleCalendarEvent } from '@/lib/calendar/events'
import { fetchGoogleCalendarApi } from '@/lib/calendar/authenticated-fetch'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
export const maxDuration = 60
const schema = z.object({
  applicationId: z.string().uuid(), token: z.string().max(500),
  slotStart: z.string().datetime().optional(),
  preferredTime: z.string().trim().min(3).max(500).optional(),
}).refine((v) => Boolean(v.slotStart || v.preferredTime))

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, 'booking')
  if (limited) return limited
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'Choose a time or enter your preferred availability.' }, { status: 422 })
  let googleEventId: string | undefined
  try {
    const input = parsed.data
    if (!verifyJoinBookingToken(input.applicationId, input.token)) return NextResponse.json({ ok: false, error: 'Your booking session expired. Please contact Jackson at 570-900-1977.' }, { status: 403 })
    const application = await prisma.joinApplication.findUnique({ where: { id: input.applicationId } })
    if (!application || !application.consentAccepted) return NextResponse.json({ ok: false, error: 'Please submit the recruiting interest form first.' }, { status: 404 })
    const attribution = { source: application.source, medium: application.medium, campaign: application.campaign }

    if (!input.slotStart) {
      const booked = await prisma.appointment.findFirst({ where: { contactId: application.contactId, inquiryId: application.inquiryId, bookingSource: 'join_scheduler', status: { in: ['Booked', 'Confirmed'] }, scheduledFor: { gte: new Date() } } })
      if (booked) return NextResponse.json({ ok: true, scheduledFor: booked.scheduledFor?.toISOString(), meetingUrl: booked.location === 'Phone call' ? null : booked.location })
      if (application.status === 'Intro Call Requested' && application.preferredCallTime === input.preferredTime) return NextResponse.json({ ok: true, requested: true })
      await prisma.$transaction(async (tx) => {
        await tx.joinApplication.update({ where: { id: application.id }, data: { preferredCallTime: input.preferredTime, status: 'Intro Call Requested' } })
        await tx.task.create({ data: { title: `Schedule recruiting conversation - ${application.fullName}`, description: `Requested availability: ${input.preferredTime}. Application: ${application.id}`, contactId: application.contactId, inquiryId: application.inquiryId, dueAt: new Date(Date.now() + 86400000) } })
        await tx.joinFormEvent.create({ data: { applicationId: application.id, leadSessionId: application.leadSessionId, eventType: 'join_intro_requested', ...attribution, metadata: { preferredTime: input.preferredTime! } } })
      })
      return NextResponse.json({ ok: true, requested: true })
    }

    const start = new Date(input.slotStart)
    const end = new Date(start.getTime() + BOOKING_CONFIG.durationMinutes * 60000)
    const days = await loadOfferedAvailability()
    if (!days.some((day) => day.slots.includes(start.toISOString()))) return NextResponse.json({ ok: false, error: 'That time is no longer available. Please refresh the available times.' }, { status: 409 })
    const result = await prisma.$transaction(async (tx) => {
      // Serialize native recruiting bookings and prevent duplicate retries.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(904621)`
      const existing = await tx.appointment.findFirst({ where: { contactId: application.contactId, inquiryId: application.inquiryId, bookingSource: 'join_scheduler', status: { in: ['Booked', 'Confirmed'] }, scheduledFor: { gte: new Date() } } })
      if (existing) return { appointment: existing, meetingUrl: existing.location }
      const conflict = await tx.appointment.findFirst({ where: { status: { in: ['Booked', 'Confirmed'] }, scheduledFor: { gt: new Date(start.getTime() - (BOOKING_CONFIG.durationMinutes + BOOKING_CONFIG.bufferMinutes) * 60000), lt: new Date(end.getTime() + BOOKING_CONFIG.bufferMinutes * 60000) } } })
      if (conflict) throw new Error('SLOT_CONFLICT')
      const googleEvent = await createGoogleCalendarEvent({ summary: `Recruiting Intro - ${application.fullName}`, description: `Join Our Team introductory conversation.\nApplication: ${application.id}\nLicensing: ${application.licenseStatus}\nPhone: ${application.phone}\nSource: ${application.source} / ${application.medium} / ${application.campaign}`, start: start.toISOString(), end: end.toISOString(), attendeeEmail: application.email, attendeeName: application.fullName })
      googleEventId = googleEvent.id
      const meetingUrl = googleEvent.hangoutLink ?? null
      const appointment = await tx.appointment.create({ data: { contactId: application.contactId, inquiryId: application.inquiryId, bookingSource: 'join_scheduler', ...attribution, scheduledFor: start, status: 'Booked', location: meetingUrl ?? 'Phone call', calendlyEventId: googleEvent.id, metadata: { applicationId: application.id, intent: 'JOIN_AGENT', provider: 'google', meetingUrl, eventLink: googleEvent.htmlLink ?? null } } })
      await tx.calendarEvent.create({ data: { contactId: application.contactId, inquiryId: application.inquiryId, appointmentId: appointment.id, provider: 'google', externalId: googleEvent.id, title: `Recruiting Intro - ${application.fullName}`, startAt: start, endAt: end, timezone: BOOKING_CONFIG.timezone, meetingUrl, location: meetingUrl ?? 'Phone call', status: 'scheduled' } })
      await tx.joinApplication.update({ where: { id: application.id }, data: { status: 'Intro Call Booked', preferredCallTime: start.toISOString() } })
      if (application.inquiryId) await tx.inquiry.update({ where: { id: application.inquiryId }, data: { intent: 'JOIN_AGENT', status: 'BOOKED', stage: 'Booked' } })
      await tx.task.create({ data: { title: `Prepare for recruiting conversation - ${application.fullName}`, description: `Application ${application.id}; scheduled ${start.toISOString()}`, contactId: application.contactId, inquiryId: application.inquiryId, dueAt: new Date(start.getTime() - 7200000) } })
      await tx.joinFormEvent.create({ data: { applicationId: application.id, leadSessionId: application.leadSessionId, eventType: 'join_intro_booked', ...attribution, metadata: { appointmentId: appointment.id, scheduledFor: start.toISOString() } } })
      return { appointment, meetingUrl }
    }, { timeout: 20000 })
    return NextResponse.json({ ok: true, scheduledFor: result.appointment.scheduledFor?.toISOString(), meetingUrl: result.meetingUrl })
  } catch (err) {
    // If durable saving fails, remove the event rather than orphan a booking.
    if (googleEventId) await fetchGoogleCalendarApi(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(BOOKING_CONFIG.calendarId)}/events/${encodeURIComponent(googleEventId)}`, { method: 'DELETE' }).catch((cleanup) => logger.error({ err: cleanup }, 'Recruiting calendar cleanup failed'))
    logger.error({ err }, 'Recruiting booking failed')
    const conflict = err instanceof Error && err.message === 'SLOT_CONFLICT'
    return NextResponse.json({ ok: false, error: conflict ? 'That time was just booked. Please choose another time.' : 'We could not confirm that time. Your application is saved; request a call time or call 570-900-1977.' }, { status: conflict ? 409 : 503 })
  }
}
