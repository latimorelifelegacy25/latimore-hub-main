/**
 * Email (Resend) + SMS (Twilio) helpers for Cloudflare Worker
 */

import type { Env } from '../index';

// ── EMAIL via Resend ──────────────────────────────────────────────────────────

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
}

export async function sendEmail(env: Env, opts: EmailOptions): Promise<{ id?: string; error?: string }> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: opts.from || 'Jackson Latimore <Jackson1989@latimorelegacy.com>',
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        reply_to: opts.replyTo || 'Jackson1989@latimorelegacy.com',
        tags: opts.tags || [],
      }),
    });

    const data = await response.json() as { id?: string; message?: string };
    if (!response.ok) {
      console.error('[Resend] Error:', data);
      return { error: data.message || 'Email send failed' };
    }
    return { id: data.id };
  } catch (err) {
    console.error('[Resend] Exception:', err);
    return { error: String(err) };
  }
}

// ── SMS via Twilio ────────────────────────────────────────────────────────────

export interface SMSOptions {
  to: string;
  body: string;
}

export async function sendSMS(env: Env, opts: SMSOptions): Promise<{ sid?: string; error?: string }> {
  try {
    const credentials = btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`);
    const formData = new URLSearchParams({
      To: formatPhone(opts.to),
      From: env.TWILIO_PHONE_NUMBER,
      Body: opts.body,
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      }
    );

    const data = await response.json() as { sid?: string; message?: string; error_message?: string };
    if (!response.ok) {
      console.error('[Twilio] Error:', data);
      return { error: data.error_message || data.message || 'SMS send failed' };
    }
    return { sid: data.sid };
  } catch (err) {
    console.error('[Twilio] Exception:', err);
    return { error: String(err) };
  }
}

// ── EMAIL TEMPLATES ───────────────────────────────────────────────────────────

export function buildLeadConfirmationEmail(firstName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Latimore Life & Legacy</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background:#1B3A6B;padding:32px 40px;text-align:center;">
              <h1 style="color:#C8A951;font-family:Georgia,serif;font-size:28px;margin:0;letter-spacing:1px;">
                LATIMORE LIFE & LEGACY
              </h1>
              <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:8px 0 0;font-style:italic;">
                Protecting Today. Securing Tomorrow.
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="color:#1A1A2E;font-size:18px;margin:0 0 16px;">Hi ${firstName},</p>
              <p style="color:#555;font-size:16px;line-height:1.6;margin:0 0 16px;">
                Thank you for reaching out to Latimore Life & Legacy. I personally received your inquiry and I will be in touch within 24 hours to schedule your free consultation.
              </p>
              <p style="color:#555;font-size:16px;line-height:1.6;margin:0 0 24px;">
                In the meantime, if you have any questions, you can reach me directly:
              </p>
              <!-- Contact Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f6f0;border-left:4px solid #C8A951;border-radius:0 8px 8px 0;margin:0 0 24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px;color:#1B3A6B;font-weight:bold;font-size:16px;">Jackson M. Latimore Sr., MBA</p>
                    <p style="margin:0 0 4px;color:#555;font-size:14px;">Founder & CEO, Latimore Life & Legacy</p>
                    <p style="margin:0 0 4px;color:#555;font-size:14px;">📞 (717) 615-2613</p>
                    <p style="margin:0 0 4px;color:#555;font-size:14px;">📧 Jackson1989@latimorelegacy.com</p>
                    <p style="margin:0;color:#555;font-size:14px;">🌐 latimorelifelegacy.com</p>
                  </td>
                </tr>
              </table>
              <p style="color:#555;font-size:16px;line-height:1.6;margin:0 0 8px;">
                Protecting Today. Securing Tomorrow.
              </p>
              <p style="color:#1B3A6B;font-size:16px;font-weight:bold;margin:0;">
                Jackson
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f0f0f0;padding:20px 40px;text-align:center;border-top:1px solid #e0e0e0;">
              <p style="color:#888;font-size:12px;margin:0;">
                PA DOI #1268820 | NIPR #21638507 | Latimore Life & Legacy LLC<br>
                1544 Route 61 Highway S, Schuylkill County, PA<br>
                <a href="https://latimorelifelegacy.com" style="color:#C8A951;">#TheBeatGoesOn</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildLeadConfirmationSMS(firstName: string, bookingUrl: string): string {
  return `Hi ${firstName}! This is Jackson Latimore with Latimore Life & Legacy. I received your inquiry and will follow up within 24 hours. Book your free consultation here: ${bookingUrl} #TheBeatGoesOn`;
}

export function buildAgentNotificationEmail(leadData: {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  source: string;
  interest: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;">
  <div style="background:#fff;border-radius:8px;padding:24px;max-width:600px;margin:0 auto;border-left:4px solid #C8A951;">
    <h2 style="color:#1B3A6B;margin:0 0 16px;">🔔 New Lead — Latimore OS</h2>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px 0;color:#555;font-weight:bold;width:140px;">Name:</td><td style="padding:8px 0;color:#1A1A2E;">${leadData.firstName} ${leadData.lastName}</td></tr>
      <tr><td style="padding:8px 0;color:#555;font-weight:bold;">Phone:</td><td style="padding:8px 0;color:#1A1A2E;">${leadData.phone}</td></tr>
      <tr><td style="padding:8px 0;color:#555;font-weight:bold;">Email:</td><td style="padding:8px 0;color:#1A1A2E;">${leadData.email}</td></tr>
      <tr><td style="padding:8px 0;color:#555;font-weight:bold;">Source:</td><td style="padding:8px 0;color:#C8A951;font-weight:bold;">${leadData.source}</td></tr>
      <tr><td style="padding:8px 0;color:#555;font-weight:bold;">Interest:</td><td style="padding:8px 0;color:#1A1A2E;">${leadData.interest}</td></tr>
    </table>
    <div style="margin-top:20px;padding:12px;background:#1B3A6B;border-radius:6px;text-align:center;">
      <a href="https://hub.latimorelifelegacy.com/admin/leads" style="color:#C8A951;font-weight:bold;text-decoration:none;font-size:16px;">
        View in Latimore OS →
      </a>
    </div>
    <p style="color:#888;font-size:12px;margin-top:16px;">Protecting Today. Securing Tomorrow. #TheBeatGoesOn</p>
  </div>
</body>
</html>`;
}

// ── UTILITIES ─────────────────────────────────────────────────────────────────

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return `+${digits}`;
}