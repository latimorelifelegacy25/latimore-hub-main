/**
 * Booking / Calendar Webhook Handler
 * POST /api/webhooks/booking
 * Processes appointment bookings from Google Calendar / Calendly / Cal.com
 */

import type { Env } from '../index';
import { createSupabaseClient } from '../lib/supabase';
import { findOrCreateCanonicalContact, markCanonicalBooking } from '../lib/canonical-crm';
import { sendEmail, sendSMS } from '../lib/comms';
import { jsonResponse, errorResponse } from '../lib/response';
import { verifyWebhookSecret } from '../lib/auth';

interface BookingPayload {
  event_type?: string;
  booking_id?: string;
  appointment_type?: string;
  attendee_name?: string;
  attendee_email?: string;
  attendee_phone?: string;
  start_time?: string;
  end_time?: string;
  timezone?: string;
  duration_minutes?: number;
  location?: string;
  meeting_url?: string;
  notes?: string;
  utm_source?: string;
  utm_campaign?: string;
  provider?: string;
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

  const booking = normalizeBooking(payload);
  if (!booking.attendeeEmail && !booking.attendeeName) {
    return errorResponse(400, 'Missing attendee information');
  }

  console.log(`[Booking] ${booking.eventType}: booking ${booking.bookingId || 'unknown'} at ${booking.startTime}`);
  const db = createSupabaseClient(env);
  let contactId: string | null = null;
  let inquiryId: string | null = null;

  try {
    if (booking.eventType === 'booking.cancelled' && booking.bookingId) {
      const existing = await db.from('Appointment')
        .select('id,contactId,inquiryId')
        .eq('calendlyEventId', booking.bookingId)
        .single();
      if (existing.error) throw new Error(`Appointment lookup failed: ${existing.error.message}`);
      if (existing.data) {
        const appointment = existing.data as { id: string; contactId: string; inquiryId?: string | null };
        contactId = appointment.contactId;
        inquiryId = appointment.inquiryId || null;
      }
    }

    if (!contactId && booking.attendeeEmail) {
      const existing = await db.from('Contact').select('id').eq('email', booking.attendeeEmail).single();
      if (existing.error) throw new Error(`Contact lookup failed: ${existing.error.message}`);
      if (existing.data) contactId = (existing.data as { id: string }).id;
    }

    if (!contactId && booking.eventType !== 'booking.cancelled') {
      const nameParts = booking.attendeeName.trim().split(/\s+/).filter(Boolean);
      contactId = await findOrCreateCanonicalContact(db, {
        firstName: nameParts[0] || 'Unknown',
        lastName: nameParts.slice(1).join(' '),
        email: booking.attendeeEmail || null,
        phone: booking.attendeePhone || null,
        source: payload.utm_source || booking.provider || 'booking',
        campaign: payload.utm_campaign || null,
        landingPage: 'booking-webhook',
        message: booking.notes || null,
        raw: payload as unknown as Record<string, unknown>,
      });
    }

    if ((booking.eventType === 'booking.created' || booking.eventType === 'booking.rescheduled') && contactId) {
      inquiryId = await markCanonicalBooking(db, contactId, booking.startTime || null);

      let existingAppointmentId: string | null = null;
      if (booking.bookingId) {
        const existing = await db.from('Appointment').select('id').eq('calendlyEventId', booking.bookingId).single();
        if (existing.error) throw new Error(`Appointment lookup failed: ${existing.error.message}`);
        if (existing.data) existingAppointmentId = (existing.data as { id: string }).id;
      }

      const appointmentData = {
        contactId,
        inquiryId,
        bookingSource: booking.provider || 'webhook',
        source: payload.utm_source || null,
        campaign: payload.utm_campaign || null,
        scheduledFor: booking.startTime || null,
        status: booking.eventType === 'booking.rescheduled' ? 'Rescheduled' : 'Booked',
        location: booking.location || booking.meetingUrl || null,
        calendlyEventId: booking.bookingId || null,
        metadata: {
          appointmentType: booking.appointmentType,
          endTime: booking.endTime,
          timezone: booking.timezone,
          durationMinutes: booking.durationMinutes,
          meetingUrl: booking.meetingUrl,
          notes: booking.notes,
          provider: booking.provider,
          raw: payload.raw || null,
        },
      };

      if (existingAppointmentId) {
        const updated = await db.from('Appointment').update(appointmentData).eq('id', existingAppointmentId).execute();
        if (updated.error) throw new Error(`Appointment update failed: ${updated.error.message}`);
      } else {
        const created = await db.from('Appointment').insert(appointmentData);
        if (created.error) throw new Error(`Appointment create failed: ${created.error.message}`);
      }

      const event = await db.from('SystemEvent').insert({
        type: booking.eventType,
        contactId,
        inquiryId,
        source: booking.provider || 'booking_webhook',
        campaign: payload.utm_campaign || null,
        payload: appointmentData,
        occurredAt: new Date().toISOString(),
      });
      if (event.error) console.error('[Booking] SystemEvent write failed:', event.error);
    } else if (booking.eventType === 'booking.cancelled') {
      if (booking.bookingId) {
        const cancelled = await db.from('Appointment')
          .update({ status: 'Cancelled' })
          .eq('calendlyEventId', booking.bookingId)
          .execute();
        if (cancelled.error) throw new Error(`Appointment cancellation failed: ${cancelled.error.message}`);
      }

      if (contactId) {
        const contactUpdate = await db.from('Contact').update({
          status: 'CONTACTED',
          nextFollowUpAt: new Date(Date.now() + 2 * 3600000).toISOString(),
          lastActivityAt: new Date().toISOString(),
        }).eq('id', contactId).execute();
        if (contactUpdate.error) throw new Error(`Contact cancellation update failed: ${contactUpdate.error.message}`);

        if (inquiryId) {
          const inquiryUpdate = await db.from('Inquiry').update({ status: 'CONTACTED', stage: 'Follow_Up' }).eq('id', inquiryId).execute();
          if (inquiryUpdate.error) throw new Error(`Inquiry cancellation update failed: ${inquiryUpdate.error.message}`);
        }
      }
    }
  } catch (error) {
    console.error('[Booking] Canonical CRM write failed:', error);
    return errorResponse(500, 'Failed to save booking');
  }

  if (booking.eventType === 'booking.created' || booking.eventType === 'booking.rescheduled') {
    if (booking.attendeeEmail) {
      const firstName = booking.attendeeName?.split(' ')[0] || 'Friend';
      const formattedTime = formatAppointmentTime(booking.startTime, booking.timezone);
      ctx.waitUntil(sendEmail(env, {
        to: booking.attendeeEmail,
        subject: `Your Consultation is Confirmed — ${formattedTime}`,
        html: buildBookingConfirmationEmail(firstName, formattedTime, booking.meetingUrl),
        tags: [{ name: 'type', value: 'booking_confirmation' }],
      }));

      if (booking.attendeePhone) {
        ctx.waitUntil(sendSMS(env, {
          to: booking.attendeePhone,
          body: `Hi ${firstName}! Your consultation with Jackson Latimore is confirmed for ${formattedTime}. ${booking.meetingUrl ? `Join here: ${booking.meetingUrl}` : 'We\'ll call you at this number.'} #TheBeatGoesOn`,
        }));
      }
    }

    ctx.waitUntil(sendEmail(env, {
      to: 'Jackson1989@latimorelegacy.com',
      subject: `📅 New Appointment: ${booking.attendeeName} — ${formatAppointmentTime(booking.startTime, booking.timezone)}`,
      html: buildAgentBookingEmail(booking),
      tags: [{ name: 'type', value: 'booking_notification' }],
    }));

    ctx.waitUntil(sendSMS(env, {
      to: env.TWILIO_PHONE_NUMBER,
      body: `📅 New appt: ${booking.attendeeName} | ${formatAppointmentTime(booking.startTime, booking.timezone)} | ${booking.appointmentType || 'discovery_call'}`,
    }));
  } else if (booking.eventType === 'booking.cancelled') {
    ctx.waitUntil(sendSMS(env, {
      to: env.TWILIO_PHONE_NUMBER,
      body: `❌ Cancelled: ${booking.attendeeName} | ${formatAppointmentTime(booking.startTime, booking.timezone)}`,
    }));
  }

  return jsonResponse({ success: true, event_type: booking.eventType });
}

// ── NORMALIZER ────────────────────────────────────────────────────────────────

function normalizeBooking(payload: BookingPayload) {
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
      provider: payload.provider || 'cal',
    };
  }

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
    provider: payload.provider || 'manual',
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
        <tr><td style="background:#0E1A2B;padding:32px 40px;text-align:center;">
          <h1 style="color:#C9A25F;font-size:24px;margin:0;">✅ Consultation Confirmed</h1>
          <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:8px 0 0;">Latimore Life & Legacy</p>
        </td></tr>
        <tr><td style="padding:40px;">
          <p style="color:#1A1A2E;font-size:18px;margin:0 0 16px;">Hi ${escapeHtml(firstName)},</p>
          <p style="color:#555;font-size:16px;line-height:1.6;margin:0 0 16px;">
            Your consultation with Jackson M. Latimore Sr., MBA is confirmed for:
          </p>
          <div style="background:#f8f6f0;border-left:4px solid #C9A25F;padding:20px 24px;margin:0 0 24px;border-radius:0 8px 8px 0;">
            <p style="margin:0;color:#0E1A2B;font-size:20px;font-weight:bold;">${escapeHtml(formattedTime)}</p>
            ${safeMeetingUrl ? `<p style="margin:8px 0 0;"><a href="${escapeHtml(safeMeetingUrl)}" style="color:#C9A25F;">Join Video Call →</a></p>` : '<p style="margin:8px 0 0;color:#555;font-size:14px;">We will call you at the number you provided.</p>'}
          </div>
          <p style="color:#555;font-size:16px;line-height:1.6;margin:0 0 16px;">
            To prepare, think about: your current coverage, your family\'s financial needs, and any questions you have about life insurance or retirement planning.
          </p>
          <p style="color:#555;font-size:14px;">Questions? Call or text: <strong>(570) 900-1977</strong></p>
          <p style="color:#0E1A2B;font-weight:bold;margin-top:24px;">Protecting Today. Securing Tomorrow. #TheBeatGoesOn</p>
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
  <div style="background:#fff;border-radius:8px;padding:24px;max-width:600px;margin:0 auto;border-left:4px solid #C9A25F;">
    <h2 style="color:#0E1A2B;margin:0 0 16px;">📅 New Appointment — Latimore OS</h2>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px 0;color:#555;font-weight:bold;width:160px;">Name:</td><td style="padding:8px 0;">${escapeHtml(booking.attendeeName)}</td></tr>
      <tr><td style="padding:8px 0;color:#555;font-weight:bold;">Email:</td><td style="padding:8px 0;">${escapeHtml(booking.attendeeEmail)}</td></tr>
      <tr><td style="padding:8px 0;color:#555;font-weight:bold;">Phone:</td><td style="padding:8px 0;">${escapeHtml(booking.attendeePhone || 'Not provided')}</td></tr>
      <tr><td style="padding:8px 0;color:#555;font-weight:bold;">Time:</td><td style="padding:8px 0;color:#0E1A2B;font-weight:bold;">${escapeHtml(time)}</td></tr>
      <tr><td style="padding:8px 0;color:#555;font-weight:bold;">Type:</td><td style="padding:8px 0;">${escapeHtml(booking.appointmentType)}</td></tr>
      ${safeMeetingUrl ? `<tr><td style="padding:8px 0;color:#555;font-weight:bold;">Link:</td><td style="padding:8px 0;"><a href="${escapeHtml(safeMeetingUrl)}" style="color:#C9A25F;">${escapeHtml(safeMeetingUrl)}</a></td></tr>` : ''}
      ${booking.notes ? `<tr><td style="padding:8px 0;color:#555;font-weight:bold;">Notes:</td><td style="padding:8px 0;">${escapeHtml(booking.notes)}</td></tr>` : ''}
    </table>
    <div style="margin-top:20px;padding:12px;background:#0E1A2B;border-radius:6px;text-align:center;">
      <a href="https://hub.latimorelifelegacy.com/admin/appointments" style="color:#C9A25F;font-weight:bold;text-decoration:none;">View in Latimore OS →</a>
    </div>
  </div>
</body>
</html>`;
}
