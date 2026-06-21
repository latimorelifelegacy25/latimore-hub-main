/**
 * Booking / Calendar Webhook Handler
 * POST /api/webhooks/booking
 * Processes appointment bookings from Google Calendar / Calendly / Cal.com
 */

import type { Env } from '../index';
import { createSupabaseClient } from '../lib/supabase';
import { sendEmail, sendSMS } from '../lib/comms';
import { jsonResponse, errorResponse } from '../lib/response';
import { verifyWebhookSecret } from '../lib/auth';

interface BookingPayload {
  // Generic booking fields (normalized from any booking provider)
  event_type?: string;       // 'booking.created' | 'booking.cancelled' | 'booking.rescheduled'
  booking_id?: string;
  appointment_type?: string; // 'discovery_call' | 'life_insurance_consultation' | etc.

  // Attendee
  attendee_name?: string;
  attendee_email?: string;
  attendee_phone?: string;

  // Scheduling
  start_time?: string;       // ISO 8601
  end_time?: string;
  timezone?: string;
  duration_minutes?: number;
  location?: string;
  meeting_url?: string;

  // Notes
  notes?: string;
  utm_source?: string;
  utm_campaign?: string;

  // Raw provider payload
  provider?: string;         // 'google' | 'calendly' | 'cal'
  raw?: Record<string, unknown>;
}

export async function handleBookingWebhook(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  if (!verifyWebhookSecret(request, env.BOOKING_WEBHOOK_SECRET)) {
    console.warn('[Booking] Rejected webhook: invalid or missing x-webhook-secret');
    return errorResponse(401, 'Invalid secret');
  }

  let payload: BookingPayload;
  try {
    payload = await request.json() as BookingPayload;
  } catch {
    return errorResponse(400, 'Invalid JSON body');
  }

  // Normalize payload from different providers
  const booking = normalizeBooking(payload);

  if (!booking.attendeeEmail && !booking.attendeeName) {
    return errorResponse(400, 'Missing attendee information');
  }

  console.log(`[Booking] ${booking.eventType}: ${booking.attendeeName} at ${booking.startTime}`);

  const db = createSupabaseClient(env);

  // Find or create contact
  let contactId: string | null = null;
  if (booking.attendeeEmail) {
    const { data } = await db
      .from('contacts')
      .select('id, first_name, lead_status')
      .eq('email', booking.attendeeEmail)
      .single();

    if (data) {
      const contact = data as { id: string; first_name: string; lead_status: string };
      contactId = contact.id;

      // Update contact status to assessment_scheduled
      if (booking.eventType === 'booking.created') {
        ctx.waitUntil(
          db.from('contacts').update({
            lead_status: 'assessment_scheduled',
            next_follow_up_at: booking.startTime,
          }).eq('id', contactId).execute()
        );
      }
    }
  }

  // Write appointment to DB
  if (booking.eventType === 'booking.created' || booking.eventType === 'booking.rescheduled') {
    const { data: appt, error } = await db.from('appointments').insert({
      contact_id: contactId,
      appointment_type: booking.appointmentType || 'discovery_call',
      status: 'scheduled',
      channel: booking.meetingUrl ? 'video_call' : 'phone_call',
      scheduled_at: booking.startTime,
      duration_minutes: booking.durationMinutes || 30,
      timezone: booking.timezone || 'America/New_York',
      location: booking.location || booking.meetingUrl || null,
      notes: booking.notes || null,
    });

    if (error) {
      console.error('[Booking] DB insert error:', error);
    }

    // Send confirmation to attendee
    if (booking.attendeeEmail) {
      const firstName = booking.attendeeName?.split(' ')[0] || 'Friend';
      const formattedTime = formatAppointmentTime(booking.startTime, booking.timezone);

      ctx.waitUntil(
        sendEmail(env, {
          to: booking.attendeeEmail,
          subject: `Your Consultation is Confirmed — ${formattedTime}`,
          html: buildBookingConfirmationEmail(firstName, formattedTime, booking.meetingUrl),
          tags: [{ name: 'type', value: 'booking_confirmation' }],
        })
      );

      if (booking.attendeePhone) {
        ctx.waitUntil(
          sendSMS(env, {
            to: booking.attendeePhone,
            body: `Hi ${firstName}! Your consultation with Jackson Latimore is confirmed for ${formattedTime}. ${booking.meetingUrl ? `Join here: ${booking.meetingUrl}` : 'We\'ll call you at this number.'} #TheBeatGoesOn`,
          })
        );
      }
    }

    // Notify Jackson
    ctx.waitUntil(
      sendEmail(env, {
        to: 'Jackson1989@latimorelegacy.com',
        subject: `📅 New Appointment: ${booking.attendeeName} — ${formatAppointmentTime(booking.startTime, booking.timezone)}`,
        html: buildAgentBookingEmail(booking),
        tags: [{ name: 'type', value: 'booking_notification' }],
      })
    );

    ctx.waitUntil(
      sendSMS(env, {
        to: env.TWILIO_PHONE_NUMBER,
        body: `📅 New appt: ${booking.attendeeName} | ${formatAppointmentTime(booking.startTime, booking.timezone)} | ${booking.appointmentType || 'discovery_call'}`,
      })
    );

  } else if (booking.eventType === 'booking.cancelled') {
    // Update appointment status
    if (booking.bookingId) {
      ctx.waitUntil(
        db.from('appointments')
          .update({ status: 'cancelled' })
          .eq('google_event_id', booking.bookingId)
          .execute()
      );
    }

    // Update contact status back to contacted
    if (contactId) {
      ctx.waitUntil(
        db.from('contacts').update({
          lead_status: 'contacted',
          next_follow_up_at: new Date(Date.now() + 2 * 3600000).toISOString(), // 2h follow-up
        }).eq('id', contactId).execute()
      );
    }

    // Notify Jackson of cancellation
    ctx.waitUntil(
      sendSMS(env, {
        to: env.TWILIO_PHONE_NUMBER,
        body: `❌ Cancelled: ${booking.attendeeName} | ${formatAppointmentTime(booking.startTime, booking.timezone)}`,
      })
    );
  }

  return jsonResponse({ success: true, event_type: booking.eventType });
}

// ── NORMALIZER ────────────────────────────────────────────────────────────────

function normalizeBooking(payload: BookingPayload) {
  // Handle Cal.com format
  if (payload.provider === 'cal' || payload.raw?.type) {
    const raw = payload.raw || {};
    return {
      eventType: payload.event_type || 'booking.created',
      bookingId: String(raw.id || payload.booking_id || ''),
      appointmentType: mapAppointmentType(String(raw.eventType || payload.appointment_type || '')),
      attendeeName: String(raw.attendeeName || payload.attendee_name || ''),
      attendeeEmail: String(raw.attendeeEmail || payload.attendee_email || ''),
      attendeePhone: String(raw.attendeePhone || payload.attendee_phone || ''),
      startTime: String(raw.startTime || payload.start_time || ''),
      endTime: String(raw.endTime || payload.end_time || ''),
      timezone: String(raw.timeZone || payload.timezone || 'America/New_York'),
      durationMinutes: Number(raw.length || payload.duration_minutes || 30),
      location: String(raw.location || payload.location || ''),
      meetingUrl: String(raw.videoCallUrl || payload.meeting_url || ''),
      notes: String(raw.description || payload.notes || ''),
    };
  }

  // Default / generic format
  return {
    eventType: payload.event_type || 'booking.created',
    bookingId: payload.booking_id || '',
    appointmentType: mapAppointmentType(payload.appointment_type || ''),
    attendeeName: payload.attendee_name || '',
    attendeeEmail: payload.attendee_email || '',
    attendeePhone: payload.attendee_phone || '',
    startTime: payload.start_time || '',
    endTime: payload.end_time || '',
    timezone: payload.timezone || 'America/New_York',
    durationMinutes: payload.duration_minutes || 30,
    location: payload.location || '',
    meetingUrl: payload.meeting_url || '',
    notes: payload.notes || '',
  };
}

function mapAppointmentType(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes('discovery') || lower.includes('intro')) return 'discovery_call';
  if (lower.includes('annuity') || lower.includes('retirement')) return 'annuity_consultation';
  if (lower.includes('final') || lower.includes('expense')) return 'final_expense_consultation';
  if (lower.includes('iul') || lower.includes('tax')) return 'iul_strategy_session';
  if (lower.includes('review') || lower.includes('annual')) return 'annual_review';
  if (lower.includes('recruit') || lower.includes('agent') || lower.includes('career')) return 'recruiting_discovery';
  return 'life_insurance_consultation';
}

function formatAppointmentTime(isoTime: string, timezone = 'America/New_York'): string {
  if (!isoTime) return 'TBD';
  try {
    return new Date(isoTime).toLocaleString('en-US', {
      timeZone: timezone,
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  } catch {
    return isoTime;
  }
}

// ── EMAIL TEMPLATES ───────────────────────────────────────────────────────────

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildBookingConfirmationEmail(firstName: string, formattedTime: string, meetingUrl?: string): string {
  const safeMeetingUrl = meetingUrl ? encodeURI(meetingUrl) : '';
  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;">
        <tr><td style="background:#1B3A6B;padding:32px 40px;text-align:center;">
          <h1 style="color:#C8A951;font-size:24px;margin:0;">✅ Consultation Confirmed</h1>
          <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:8px 0 0;">Latimore Life & Legacy</p>
        </td></tr>
        <tr><td style="padding:40px;">
          <p style="color:#1A1A2E;font-size:18px;margin:0 0 16px;">Hi ${escapeHtml(firstName)},</p>
          <p style="color:#555;font-size:16px;line-height:1.6;margin:0 0 16px;">
            Your consultation with Jackson M. Latimore Sr., MBA is confirmed for:
          </p>
          <div style="background:#f8f6f0;border-left:4px solid #C8A951;padding:20px 24px;margin:0 0 24px;border-radius:0 8px 8px 0;">
            <p style="margin:0;color:#1B3A6B;font-size:20px;font-weight:bold;">${escapeHtml(formattedTime)}</p>
            ${safeMeetingUrl ? `<p style="margin:8px 0 0;"><a href="${escapeHtml(safeMeetingUrl)}" style="color:#C8A951;">Join Video Call →</a></p>` : '<p style="margin:8px 0 0;color:#555;font-size:14px;">We will call you at the number you provided.</p>'}
          </div>
          <p style="color:#555;font-size:16px;line-height:1.6;margin:0 0 16px;">
            To prepare, think about: your current coverage, your family\'s financial needs, and any questions you have about life insurance or retirement planning.
          </p>
          <p style="color:#555;font-size:14px;">Questions? Call or text: <strong>(717) 615-2613</strong></p>
          <p style="color:#1B3A6B;font-weight:bold;margin-top:24px;">Protecting Today. Securing Tomorrow. #TheBeatGoesOn</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildAgentBookingEmail(booking: ReturnType<typeof normalizeBooking>): string {
  const time = formatAppointmentTime(booking.startTime, booking.timezone);
  const safeMeetingUrl = booking.meetingUrl ? encodeURI(booking.meetingUrl) : '';
  return `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;">
  <div style="background:#fff;border-radius:8px;padding:24px;max-width:600px;margin:0 auto;border-left:4px solid #C8A951;">
    <h2 style="color:#1B3A6B;margin:0 0 16px;">📅 New Appointment — Latimore OS</h2>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px 0;color:#555;font-weight:bold;width:160px;">Name:</td><td style="padding:8px 0;">${escapeHtml(booking.attendeeName)}</td></tr>
      <tr><td style="padding:8px 0;color:#555;font-weight:bold;">Email:</td><td style="padding:8px 0;">${escapeHtml(booking.attendeeEmail)}</td></tr>
      <tr><td style="padding:8px 0;color:#555;font-weight:bold;">Phone:</td><td style="padding:8px 0;">${escapeHtml(booking.attendeePhone || 'Not provided')}</td></tr>
      <tr><td style="padding:8px 0;color:#555;font-weight:bold;">Time:</td><td style="padding:8px 0;color:#1B3A6B;font-weight:bold;">${escapeHtml(time)}</td></tr>
      <tr><td style="padding:8px 0;color:#555;font-weight:bold;">Type:</td><td style="padding:8px 0;">${escapeHtml(booking.appointmentType)}</td></tr>
      ${safeMeetingUrl ? `<tr><td style="padding:8px 0;color:#555;font-weight:bold;">Link:</td><td style="padding:8px 0;"><a href="${escapeHtml(safeMeetingUrl)}" style="color:#C8A951;">${escapeHtml(safeMeetingUrl)}</a></td></tr>` : ''}
      ${booking.notes ? `<tr><td style="padding:8px 0;color:#555;font-weight:bold;">Notes:</td><td style="padding:8px 0;">${escapeHtml(booking.notes)}</td></tr>` : ''}
    </table>
    <div style="margin-top:20px;padding:12px;background:#1B3A6B;border-radius:6px;text-align:center;">
      <a href="https://hub.latimorelifelegacy.com/admin/appointments" style="color:#C8A951;font-weight:bold;text-decoration:none;">View in Latimore OS →</a>
    </div>
  </div>
</body>
</html>`;
}