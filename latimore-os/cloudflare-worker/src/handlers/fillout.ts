/**
 * Fillout Webhook Handler
 * POST /api/webhooks/fillout
 * Writes to canonical Contact + Inquiry records.
 */

import type { Env } from '../index';
import { createSupabaseClient } from '../lib/supabase';
import { findOrCreateCanonicalContact, hasRecentCanonicalInquiry, createCanonicalInquiry } from '../lib/canonical-crm';
import { sendEmail, sendSMS, buildLeadConfirmationEmail, buildLeadConfirmationSMS, buildAgentNotificationEmail } from '../lib/comms';
import { jsonResponse, errorResponse } from '../lib/response';
import { verifyFilloutSignature } from '../lib/auth';

interface FilloutSubmission {
  formId: string;
  submissionId: string;
  submissionTime: string;
  questions: FilloutQuestion[];
  urlParameters?: { name: string; value: string }[];
}

interface FilloutQuestion {
  id: string;
  name: string;
  type: string;
  value: string | number | boolean | null;
}

export async function handleFilloutWebhook(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  const rawBody = await request.text();
  const signature = request.headers.get('x-webhook-signature')
    ?? request.headers.get('x-fillout-signature')
    ?? request.headers.get('x-fillout-signature-256')
    ?? request.headers.get('x-hook-signature');

  if (!(await verifyFilloutSignature(rawBody, signature, env.FILLOUT_SECRET))) {
    console.warn('[Fillout] Rejected webhook: invalid or missing signature');
    return errorResponse(401, 'Invalid signature');
  }

  let submission: FilloutSubmission;
  try {
    submission = JSON.parse(rawBody) as FilloutSubmission;
  } catch {
    return errorResponse(400, 'Invalid JSON body');
  }
  if (!submission.submissionId) return errorResponse(400, 'Missing submissionId');

  const fields = extractFields(submission.questions);
  const utm = extractUTM(submission.urlParameters || []);
  const source = utm.utm_source ? mapUTMToSource(utm.utm_source) : 'website';
  const db = createSupabaseClient(env);

  let contactId: string;
  let inquiryId: string;
  try {
    contactId = await findOrCreateCanonicalContact(db, {
      firstName: fields.firstName || 'Unknown',
      lastName: fields.lastName || '',
      email: fields.email || null,
      phone: fields.phone || null,
      source,
      medium: utm.utm_medium || null,
      campaign: utm.utm_campaign || null,
      landingPage: `fillout:${submission.formId}`,
      interest: fields.interest || null,
      coverageAmount: fields.coverageAmount,
      message: fields.message || null,
      externalId: submission.submissionId,
      raw: submission as unknown as Record<string, unknown>,
    });

    if (await hasRecentCanonicalInquiry(db, contactId, 24)) {
      console.log(`[Fillout] Duplicate canonical inquiry suppressed for contact ${contactId}`);
      return jsonResponse({ success: true, submissionId: submission.submissionId });
    }

    inquiryId = await createCanonicalInquiry(db, contactId, {
      firstName: fields.firstName || 'Unknown',
      lastName: fields.lastName || '',
      email: fields.email || null,
      phone: fields.phone || null,
      source,
      medium: utm.utm_medium || null,
      campaign: utm.utm_campaign || null,
      landingPage: `fillout:${submission.formId}`,
      interest: fields.interest || null,
      coverageAmount: fields.coverageAmount,
      message: fields.message || null,
      externalId: submission.submissionId,
      raw: submission as unknown as Record<string, unknown>,
    });
  } catch (error) {
    console.error('[Fillout] Canonical CRM write failed:', error);
    return errorResponse(500, 'Failed to save submission');
  }

  if (fields.email) {
    ctx.waitUntil(sendEmail(env, {
      to: fields.email,
      subject: 'We Received Your Request — Latimore Life & Legacy',
      html: buildLeadConfirmationEmail(fields.firstName || 'Friend'),
      tags: [{ name: 'type', value: 'fillout_confirmation' }],
    }));
  }

  if (fields.phone) {
    ctx.waitUntil(sendSMS(env, {
      to: fields.phone,
      body: buildLeadConfirmationSMS(fields.firstName || 'Friend', 'https://hub.latimorelifelegacy.com/book'),
    }));
  }

  ctx.waitUntil(sendEmail(env, {
    to: 'Jackson1989@latimorelegacy.com',
    subject: `🔔 Fillout Form: ${fields.firstName} ${fields.lastName} (${submission.formId})`,
    html: buildAgentNotificationEmail({
      firstName: fields.firstName || 'Unknown',
      lastName: fields.lastName || '',
      phone: fields.phone || 'Not provided',
      email: fields.email || 'Not provided',
      source: `Fillout: ${submission.formId}`,
      interest: fields.interest || 'General inquiry',
    }),
  }));

  ctx.waitUntil(env.WORKFLOW_QUEUE.send({
    workflow: 'lead-follow-up',
    trigger: 'lead_created',
    payload: {
      lead_id: inquiryId,
      inquiry_id: inquiryId,
      contact_id: contactId,
      submission_id: submission.submissionId,
      form_id: submission.formId,
      first_name: fields.firstName,
      email: fields.email,
      phone: fields.phone,
      source,
      interest: fields.interest,
    },
  }));

  console.log(`[Fillout] Canonical inquiry ${inquiryId} created for submission ${submission.submissionId}`);
  return jsonResponse({ success: true, submissionId: submission.submissionId });
}

function extractFields(questions: FilloutQuestion[]): {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  interest: string;
  coverageAmount: number | null;
  message: string;
  dateOfBirth: string;
  occupation: string;
} {
  const result = {
    firstName: '', lastName: '', email: '', phone: '', interest: '',
    coverageAmount: null as number | null, message: '', dateOfBirth: '', occupation: '',
  };

  for (const q of questions) {
    const name = q.name.toLowerCase();
    const value = String(q.value || '').trim();
    if (name.includes('first') && name.includes('name')) result.firstName = value;
    else if (name.includes('last') && name.includes('name')) result.lastName = value;
    else if (name.includes('full') && name.includes('name')) {
      const parts = value.split(' ');
      result.firstName = parts[0] || '';
      result.lastName = parts.slice(1).join(' ') || '';
    } else if (name.includes('email')) result.email = value;
    else if (name.includes('phone') || name.includes('mobile')) result.phone = value;
    else if (name.includes('interest') || name.includes('looking for') || name.includes('product')) result.interest = value;
    else if (name.includes('coverage') || name.includes('amount')) {
      const num = parseFloat(value.replace(/[^0-9.]/g, ''));
      if (!Number.isNaN(num)) result.coverageAmount = num;
    } else if (name.includes('message') || name.includes('comment') || name.includes('question')) result.message = value;
    else if (name.includes('birth') || name.includes('dob')) result.dateOfBirth = value;
    else if (name.includes('occupation') || name.includes('job') || name.includes('employer')) result.occupation = value;
  }
  return result;
}

function extractUTM(params: { name: string; value: string }[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const p of params) if (p.name.startsWith('utm_')) result[p.name] = p.value;
  return result;
}

function mapUTMToSource(utmSource: string): string {
  const map: Record<string, string> = {
    facebook: 'facebook', instagram: 'instagram', linkedin: 'linkedin',
    google: 'google', print: 'print', direct: 'direct', referral: 'referral',
  };
  return map[utmSource.toLowerCase()] || 'website';
}
