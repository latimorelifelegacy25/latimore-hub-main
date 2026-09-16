/**
 * Lead Intake Handler
 * POST /api/lead
 * Writes to the canonical Prisma-managed Contact + Inquiry data core.
 */

import type { Env } from '../index';
import { createSupabaseClient } from '../lib/supabase';
import { findOrCreateCanonicalContact, hasRecentCanonicalInquiry, createCanonicalInquiry } from '../lib/canonical-crm';
import { sendEmail, sendSMS, buildLeadConfirmationEmail, buildLeadConfirmationSMS, buildAgentNotificationEmail } from '../lib/comms';
import { jsonResponse, errorResponse } from '../lib/response';

interface LeadPayload {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  interest?: string;
  coverage_amount?: number;
  message?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  referrer_url?: string;
  landing_page?: string;
  qr_code_id?: string;
}

export async function handleLeadIntake(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  let payload: LeadPayload;
  try {
    payload = await request.json() as LeadPayload;
  } catch {
    return errorResponse(400, 'Invalid JSON body');
  }

  if (!payload.first_name || !payload.last_name) {
    return errorResponse(400, 'first_name and last_name are required');
  }
  if (!payload.email && !payload.phone) {
    return errorResponse(400, 'At least one of email or phone is required');
  }

  const db = createSupabaseClient(env);
  const source = mapUTMToSource(payload.utm_source);

  let contactId: string;
  let inquiryId: string;
  try {
    contactId = await findOrCreateCanonicalContact(db, {
      firstName: payload.first_name,
      lastName: payload.last_name,
      email: payload.email || null,
      phone: payload.phone || null,
      source,
      medium: payload.utm_medium || null,
      campaign: payload.utm_campaign || null,
      landingPage: payload.landing_page || null,
      interest: payload.interest || null,
      coverageAmount: payload.coverage_amount || null,
      message: payload.message || null,
      raw: payload as unknown as Record<string, unknown>,
    });

    if (await hasRecentCanonicalInquiry(db, contactId, 24)) {
      console.log(`[Lead] Duplicate canonical inquiry suppressed for contact ${contactId}`);
      return jsonResponse({ success: true, message: 'Thank you! We will be in touch shortly.' });
    }

    inquiryId = await createCanonicalInquiry(db, contactId, {
      firstName: payload.first_name,
      lastName: payload.last_name,
      email: payload.email || null,
      phone: payload.phone || null,
      source,
      medium: payload.utm_medium || null,
      campaign: payload.utm_campaign || null,
      landingPage: payload.landing_page || null,
      interest: payload.interest || null,
      coverageAmount: payload.coverage_amount || null,
      message: payload.message || null,
      raw: payload as unknown as Record<string, unknown>,
    });
  } catch (error) {
    console.error('[Lead] Canonical CRM write failed:', error);
    return errorResponse(500, 'Failed to save lead');
  }

  if (payload.email) {
    ctx.waitUntil(sendEmail(env, {
      to: payload.email,
      subject: 'Welcome to Latimore Life & Legacy — We\'ll Be in Touch Shortly',
      html: buildLeadConfirmationEmail(payload.first_name),
      tags: [
        { name: 'type', value: 'lead_confirmation' },
        { name: 'source', value: source },
      ],
    }));
  }

  if (payload.phone) {
    ctx.waitUntil(sendSMS(env, {
      to: payload.phone,
      body: buildLeadConfirmationSMS(payload.first_name, 'https://hub.latimorelifelegacy.com/book'),
    }));
  }

  ctx.waitUntil(sendEmail(env, {
    to: 'Jackson1989@latimorelegacy.com',
    subject: `🔔 New Lead: ${payload.first_name} ${payload.last_name} (${source})`,
    html: buildAgentNotificationEmail({
      firstName: payload.first_name,
      lastName: payload.last_name,
      phone: payload.phone || 'Not provided',
      email: payload.email || 'Not provided',
      source,
      interest: payload.interest || 'General inquiry',
    }),
  }));

  ctx.waitUntil(sendSMS(env, {
    to: env.TWILIO_PHONE_NUMBER,
    body: `🔔 New lead: ${payload.first_name} ${payload.last_name} | ${payload.phone || payload.email} | ${source} | ${payload.interest || 'General'}`,
  }));

  ctx.waitUntil(env.WORKFLOW_QUEUE.send({
    workflow: 'lead-follow-up',
    trigger: 'lead_created',
    payload: {
      lead_id: inquiryId,
      inquiry_id: inquiryId,
      contact_id: contactId,
      first_name: payload.first_name,
      last_name: payload.last_name,
      email: payload.email,
      phone: payload.phone,
      source,
      interest: payload.interest,
    },
  }));

  console.log(`[Lead] Canonical inquiry created: ${inquiryId} for contact ${contactId}`);
  return jsonResponse({
    success: true,
    message: 'Thank you! We will be in touch within 24 hours.',
  });
}

function mapUTMToSource(utmSource?: string): string {
  const map: Record<string, string> = {
    facebook: 'facebook',
    instagram: 'instagram',
    linkedin: 'linkedin',
    google: 'google',
    print: 'print',
    direct: 'direct',
    referral: 'referral',
  };
  return map[utmSource?.toLowerCase() || ''] || 'website';
}
