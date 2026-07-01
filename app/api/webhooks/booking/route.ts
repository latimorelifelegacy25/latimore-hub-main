export const dynamic = 'force-dynamic'
import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { BookingNotifySchema } from '@/lib/schemas'
import { logger } from '@/lib/logger'
import { recordAppointment } from '@/lib/hub/record-appointment'
import { claimWebhookEvent } from '@/lib/hub/webhook-idempotency'
import { captureException } from '@/lib/error-tracking'

function verifyWebhookSecret(req: NextRequest): boolean {
  const secret = process.env.BOOKING_WEBHOOK_SECRET
  if (!secret) {
    logger.warn({}, '[booking-webhook] BOOKING_WEBHOOK_SECRET not configured — rejecting request')
    return false
  }
  const provided = req.headers.get('x-webhook-secret') ?? ''
  try {
    const a = Buffer.from(provided)
    const b = Buffer.from(secret)
    if (a.length !== b.length) return false
    return crypto.timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, 'booking')
  if (limited) return limited

  if (!verifyWebhookSecret(req)) {
    logger.warn({}, 'Booking webhook rejected')
    return NextResponse.json({ ok: false, error: 'invalid secret' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parse = BookingNotifySchema.safeParse(body)
  if (!parse.success) return NextResponse.json({ ok: false, error: parse.error.flatten() }, { status: 422 })

  const eventId =
    parse.data.gcal_id ??
    crypto
      .createHash('sha256')
      .update(
        [
          parse.data.inquiryId ?? '',
          parse.data.lead_session_id ?? '',
          parse.data.email ?? parse.data.attendee_email ?? '',
          parse.data.phone ?? '',
          parse.data.scheduled_for ?? parse.data.start_at ?? '',
        ].join(':')
      )
      .digest('hex')

  if (!(await claimWebhookEvent('booking', eventId))) {
    return NextResponse.json({ ok: true, deduped: true }, { status: 200 })
  }

  try {
    const result = await recordAppointment({
      inquiryId: parse.data.inquiryId ?? null,
      leadSessionId: parse.data.lead_session_id ?? null,
      gcalId: parse.data.gcal_id ?? null,
      scheduledFor: parse.data.scheduled_for ?? parse.data.start_at ?? null,
      endAt: parse.data.end_at ?? null,
      bookingSource: parse.data.booking_source ?? 'booking_webhook',
      source: parse.data.source ?? null,
      medium: parse.data.medium ?? null,
      campaign: parse.data.campaign ?? null,
      location: parse.data.location ?? null,
      meetingUrl: parse.data.meeting_url ?? null,
      timezone: parse.data.timezone ?? null,
      title: parse.data.title ?? null,
      description: parse.data.description ?? null,
      firstName: parse.data.first_name ?? parse.data.firstName ?? null,
      lastName: parse.data.last_name ?? parse.data.lastName ?? null,
      fullName: parse.data.full_name ?? parse.data.fullName ?? parse.data.name ?? null,
      email: parse.data.email ?? parse.data.attendee_email ?? null,
      phone: parse.data.phone ?? null,
      county: parse.data.county ?? null,
      productInterest: parse.data.product_interest ?? parse.data.productInterest ?? null,
      landingPage: parse.data.page_url ?? null,
      notes: parse.data.notes ?? null,
      rawPayload: parse.data.metadata ?? null,
    })

    return NextResponse.json({
      ok: true,
      inquiryId: result.inquiry.id,
      appointmentId: result.appointment.id,
      createdAppointment: result.createdAppointment,
    })
  } catch (err: any) {
    await captureException(err, { source: 'booking', provider: 'booking-webhook' })
    const status = /No matching inquiry or contact/i.test(err.message) ? 404 : 500
    return NextResponse.json({ ok: false, error: status === 404 ? 'no matching inquiry or contact' : 'server error' }, { status })
  }
}
