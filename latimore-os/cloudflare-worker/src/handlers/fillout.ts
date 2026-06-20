/**
 * Fillout Webhook Handler
 * POST /api/webhooks/fillout
 * Processes form submissions from Fillout.com
 */

import type { Env } from '../index';
import { createSupabaseClient } from '../lib/supabase';
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
  ctx: ExecutionContext
): Promise<Response> {
  const rawBody = await request.text();

  const signature =
    request.headers.get('x-webhook-signature') ??
    request.headers.get('x-fillout-signature') ??
    request.headers.get('x-fillout-signature-256') ??
    request.headers.get('x-hook-signature');

  if (!(await verifyFilloutSignature(rawBody, signature, env.FILLOUT_SECRET))) {
    console.warn('[Fillout] Rejected webhook: invalid or missing signature');
    return errorResponse(401, 'Invalid signature');
  }

  // Parse body
  let submission: FilloutSubmission;
  try {
    submission = JSON.parse(rawBody) as FilloutSubmission;
  } catch {
    return errorResponse(400, 'Invalid JSON body');
  }

  if (!submission.submissionId) {
    return errorResponse(400, 'Missing submissionId');
  }

  console.log(`[Fillout] Submission: ${submission.submissionId} (form: ${submission.formId})`);

  // Extract fields from Fillout questions
  const fields = extractFields(submission.questions);

  // Extract UTM params
  const utmParams = extractUTM(submission.urlParameters || []);

  const db = createSupabaseClient(env);

  // Write lead to DB
  const { data: lead, error } = await db.from('leads').insert({
    first_name: fields.firstName || 'Unknown',
    last_name: fields.lastName || '',
    email: fields.email || null,
    phone: fields.phone || null,
    source: utmParams.utm_source ? mapUTMToSource(utmParams.utm_source) : 'website',
    utm_source: utmParams.utm_source || null,
    utm_medium: utmParams.utm_medium || null,
    utm_campaign: utmParams.utm_campaign || null,
    interest: fields.interest || null,
    coverage_amount: fields.coverageAmount || null,
    message: fields.message || null,
    landing_page: `fillout:${submission.formId}`,
    raw_payload: submission,
  });

  if (error) {
    console.error('[Fillout] DB insert error:', error);
    return errorResponse(500, 'Failed to save submission');
  }

  const leadRecord = Array.isArray(lead) ? lead[0] : lead as { id: string };

  // Create contact record (async)
  ctx.waitUntil(
    createContactFromFillout(db, fields, utmParams, leadRecord?.id)
  );

  // Send confirmation to lead (async)
  if (fields.email) {
    ctx.waitUntil(
      sendEmail(env, {
        to: fields.email,
        subject: 'We Received Your Request — Latimore Life & Legacy',
        html: buildLeadConfirmationEmail(fields.firstName || 'Friend'),
        tags: [{ name: 'type', value: 'fillout_confirmation' }],
      })
    );
  }

  if (fields.phone) {
    ctx.waitUntil(
      sendSMS(env, {
        to: fields.phone,
        body: buildLeadConfirmationSMS(
          fields.firstName || 'Friend',
          'https://hub.latimorelifelegacy.com/book'
        ),
      })
    );
  }

  // Notify agent (async)
  ctx.waitUntil(
    sendEmail(env, {
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
    })
  );

  // Queue workflow (async)
  ctx.waitUntil(
    env.WORKFLOW_QUEUE.send({
      workflow: 'lead-follow-up',
      trigger: 'fillout_submission',
      payload: {
        lead_id: leadRecord?.id,
        submission_id: submission.submissionId,
        form_id: submission.formId,
        first_name: fields.firstName,
        email: fields.email,
        phone: fields.phone,
        interest: fields.interest,
      },
    })
  );

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
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    interest: '',
    coverageAmount: null as number | null,
    message: '',
    dateOfBirth: '',
    occupation: '',
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
    }
    else if (name.includes('email')) result.email = value;
    else if (name.includes('phone') || name.includes('mobile')) result.phone = value;
    else if (name.includes('interest') || name.includes('looking for') || name.includes('product')) result.interest = value;
    else if (name.includes('coverage') || name.includes('amount')) {
      const num = parseFloat(value.replace(/[^0-9.]/g, ''));
      if (!isNaN(num)) result.coverageAmount = num;
    }
    else if (name.includes('message') || name.includes('comment') || name.includes('question')) result.message = value;
    else if (name.includes('birth') || name.includes('dob')) result.dateOfBirth = value;
    else if (name.includes('occupation') || name.includes('job') || name.includes('employer')) result.occupation = value;
  }

  return result;
}

function extractUTM(params: { name: string; value: string }[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const p of params) {
    if (p.name.startsWith('utm_')) {
      result[p.name] = p.value;
    }
  }
  return result;
}

async function createContactFromFillout(
  db: ReturnType<typeof createSupabaseClient>,
  fields: ReturnType<typeof extractFields>,
  utmParams: Record<string, string>,
  leadId?: string
): Promise<void> {
  try {
    if (!fields.email && !fields.phone) return;

    // Check for existing contact
    let existingId: string | null = null;
    if (fields.email) {
      const { data } = await db.from('contacts').select('id').eq('email', fields.email).single();
      if (data) existingId = (data as { id: string }).id;
    }

    if (!existingId) {
      const { data } = await db.from('contacts').insert({
        first_name: fields.firstName || 'Unknown',
        last_name: fields.lastName || '',
        email: fields.email || null,
        phone: fields.phone || null,
        contact_type: 'prospect',
        lead_status: 'new',
        lead_source: utmParams.utm_source ? mapUTMToSource(utmParams.utm_source) : 'website',
        utm_source: utmParams.utm_source || null,
        utm_medium: utmParams.utm_medium || null,
        utm_campaign: utmParams.utm_campaign || null,
        next_follow_up_at: new Date(Date.now() + 24 * 3600000).toISOString(),
      });
      const contact = Array.isArray(data) ? data[0] : data as { id: string } | null;
      if (leadId && contact?.id) {
        await db.from('leads').update({ contact_id: contact.id }).eq('id', leadId);
      }
    } else {
      if (leadId) {
        await db.from('leads').update({ contact_id: existingId }).eq('id', leadId);
      }
    }
  } catch (err) {
    console.error('[Fillout] Contact creation error:', err);
  }
}

function mapUTMToSource(utmSource: string): string {
  const map: Record<string, string> = {
    facebook: 'facebook', instagram: 'instagram', linkedin: 'linkedin',
    google: 'google', print: 'print', direct: 'direct', referral: 'referral',
  };
  return map[utmSource.toLowerCase()] || 'website';
}