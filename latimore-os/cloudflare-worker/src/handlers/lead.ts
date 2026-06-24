/**
 * Lead Intake Handler
 * POST /api/lead
 * Accepts lead from landing pages, writes to DB, triggers follow-up
 */

import type { Env } from '../index';
import { createSupabaseClient } from '../lib/supabase';
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
  ctx: ExecutionContext
): Promise<Response> {
  // Parse body
  let payload: LeadPayload;
  try {
    payload = await request.json() as LeadPayload;
  } catch {
    return errorResponse(400, 'Invalid JSON body');
  }

  // Validate required fields
  if (!payload.first_name || !payload.last_name) {
    return errorResponse(400, 'first_name and last_name are required');
  }
  if (!payload.email && !payload.phone) {
    return errorResponse(400, 'At least one of email or phone is required');
  }

  const db = createSupabaseClient(env);

  // Check for duplicate lead (same email or phone in last 24h)
  if (payload.email) {
    const { data: existing } = await db
      .from('leads')
      .select('id, created_at')
      .eq('email', payload.email)
      .order('created_at', { ascending: false })
      .limit(1);

    if (existing && Array.isArray(existing) && existing.length > 0) {
      const lastLead = existing[0] as { id: string; created_at: string };
      const hoursSince = (Date.now() - new Date(lastLead.created_at).getTime()) / 3600000;
      if (hoursSince < 24) {
        console.log(`[Lead] Duplicate detected for lead ${lastLead.id} (${hoursSince.toFixed(1)}h ago)`);
        // Still return success to avoid exposing duplicate detection
        return jsonResponse({ success: true, message: 'Thank you! We will be in touch shortly.' });
      }
    }
  }

  // Determine lead source from UTM
  const source = mapUTMToSource(payload.utm_source);

  // Write lead to DB
  const { data: lead, error: leadError } = await db.from('leads').insert({
    first_name: payload.first_name,
    last_name: payload.last_name,
    email: payload.email || null,
    phone: payload.phone || null,
    source,
    utm_source: payload.utm_source || null,
    utm_medium: payload.utm_medium || null,
    utm_campaign: payload.utm_campaign || null,
    utm_content: payload.utm_content || null,
    utm_term: payload.utm_term || null,
    referrer_url: payload.referrer_url || null,
    landing_page: payload.landing_page || null,
    interest: payload.interest || null,
    coverage_amount: payload.coverage_amount || null,
    message: payload.message || null,
    qr_code_id: payload.qr_code_id || null,
    raw_payload: payload,
  });

  if (leadError) {
    console.error('[Lead] DB insert error:', leadError);
    return errorResponse(500, 'Failed to save lead');
  }

  const leadRecord = Array.isArray(lead) ? lead[0] : lead as { id: string };

  // Also create/update contact record
  ctx.waitUntil(
    upsertContact(db, payload, source, leadRecord?.id)
  );

  // Send confirmation email to lead (async)
  if (payload.email) {
    ctx.waitUntil(
      sendEmail(env, {
        to: payload.email,
        subject: 'Welcome to Latimore Life & Legacy — We\'ll Be in Touch Shortly',
        html: buildLeadConfirmationEmail(payload.first_name),
        tags: [
          { name: 'type', value: 'lead_confirmation' },
          { name: 'source', value: source },
        ],
      })
    );
  }

  // Send confirmation SMS to lead (async)
  if (payload.phone) {
    ctx.waitUntil(
      sendSMS(env, {
        to: payload.phone,
        body: buildLeadConfirmationSMS(
          payload.first_name,
          'https://hub.latimorelifelegacy.com/book'
        ),
      })
    );
  }

  // Notify Jackson (agent) of new lead (async)
  ctx.waitUntil(
    sendEmail(env, {
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
    })
  );

  // Notify Jackson via SMS for hot leads (async)
  ctx.waitUntil(
    sendSMS(env, {
      to: env.TWILIO_PHONE_NUMBER,
      body: `🔔 New lead: ${payload.first_name} ${payload.last_name} | ${payload.phone || payload.email} | ${source} | ${payload.interest || 'General'}`,
    })
  );

  // Queue workflow trigger for lead follow-up
  ctx.waitUntil(
    env.WORKFLOW_QUEUE.send({
      workflow: 'lead-follow-up',
      trigger: 'lead_created',
      payload: {
        lead_id: leadRecord?.id,
        first_name: payload.first_name,
        last_name: payload.last_name,
        email: payload.email,
        phone: payload.phone,
        source,
        interest: payload.interest,
      },
    })
  );

  console.log(`[Lead] Created: ${leadRecord?.id} (${source})`);

  return jsonResponse({
    success: true,
    message: 'Thank you! We will be in touch within 24 hours.',
  });
}

async function upsertContact(
  db: ReturnType<typeof createSupabaseClient>,
  payload: LeadPayload,
  source: string,
  leadId?: string
): Promise<void> {
  try {
    // Check if contact already exists by email or phone
    let existingContact = null;

    if (payload.email) {
      const { data } = await db
        .from('contacts')
        .select('id, lead_status')
        .eq('email', payload.email)
        .single();
      existingContact = data;
    }

    if (!existingContact && payload.phone) {
      const { data } = await db
        .from('contacts')
        .select('id, lead_status')
        .eq('phone', payload.phone)
        .single();
      existingContact = data;
    }

    if (existingContact) {
      // Update existing contact
      const contact = existingContact as { id: string; lead_status: string };
      await db.from('contacts').update({
        last_contacted_at: new Date().toISOString(),
        next_follow_up_at: new Date(Date.now() + 24 * 3600000).toISOString(), // 24h from now
      }).eq('id', contact.id);

      // Link lead to contact
      if (leadId) {
        await db.from('leads').update({ contact_id: contact.id }).eq('id', leadId);
      }
    } else {
      // Create new contact
      const { data: newContact } = await db.from('contacts').insert({
        first_name: payload.first_name,
        last_name: payload.last_name,
        email: payload.email || null,
        phone: payload.phone || null,
        contact_type: 'prospect',
        lead_status: 'new',
        lead_source: source,
        utm_source: payload.utm_source || null,
        utm_medium: payload.utm_medium || null,
        utm_campaign: payload.utm_campaign || null,
        next_follow_up_at: new Date(Date.now() + 24 * 3600000).toISOString(),
        notes: payload.message || null,
      });

      const contact = Array.isArray(newContact) ? newContact[0] : newContact as { id: string } | null;

      // Link lead to new contact
      if (leadId && contact?.id) {
        await db.from('leads').update({ contact_id: contact.id }).eq('id', leadId);
      }
    }
  } catch (err) {
    console.error('[Lead] Contact upsert error:', err);
  }
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