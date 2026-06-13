import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { upsertLead } from '@/lib/hub/upsert-lead';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type LeadBody = {
  name?: string;
  phone?: string;
  email?: string;
  promo?: string;
  interest?: string;
  source?: string;
  page?: string;
  bestTime?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
};

type ValidatedLead = Required<Omit<LeadBody, 'bestTime' | 'utmSource' | 'utmMedium' | 'utmCampaign'>> & {
  bestTime: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
};

function clean(value: unknown, max = 500) {
  return String(value || '').trim().slice(0, max);
}

function splitName(full: string): { firstName: string | null; lastName: string | null } {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0] || null, lastName: null };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

async function saveToCRM(lead: ValidatedLead) {
  const { firstName, lastName } = splitName(lead.name);
  const notes = [
    `Coverage interest: ${lead.interest}`,
    lead.bestTime ? `Best time to call: ${lead.bestTime}` : null,
    lead.promo ? `Promo/Coupon: ${lead.promo}` : null,
  ].filter(Boolean).join(' | ');
  const { contact, inquiry } = await upsertLead({
    firstName,
    lastName,
    email: lead.email || null,
    phone: lead.phone,
    productInterest: lead.interest,
    source: lead.utmSource || lead.source,
    medium: lead.utmMedium || null,
    campaign: lead.utmCampaign || null,
    landingPage: lead.page,
    notes,
    metadata: {
      form: 'pahs-lead',
      promo: lead.promo || null,
      bestTime: lead.bestTime || null,
      utmSource: lead.utmSource || null,
      utmMedium: lead.utmMedium || null,
      utmCampaign: lead.utmCampaign || null,
    },
  });
  return { contact: contact.id, inquiry: inquiry.id };
}

async function saveToSupabase(lead: ValidatedLead) {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return { skipped: true, reason: 'Supabase env vars not configured.' };

  const table = process.env.PAHS_LEADS_TABLE || 'pahs_leads';
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { error } = await supabase.from(table).insert({
    full_name: lead.name,
    phone: lead.phone,
    email: lead.email || null,
    promo_code: lead.promo || null,
    product_interest: lead.interest,
    lead_source: lead.source,
    page_source: lead.page,
    status: 'New',
    county: null,
    notes: 'PAHS sponsorship landing page consultation request.',
  });

  if (error) throw new Error(`Supabase insert failed: ${error.message}`);
  return { skipped: false };
}

async function sendNotification(lead: ValidatedLead) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { skipped: true, reason: 'RESEND_API_KEY not configured.' };

  const resend = new Resend(apiKey);
  const to = process.env.LEAD_NOTIFY_TO || process.env.NOTIFY_TO || 'Jackson1989@latimorelegacy.com';
  const from = process.env.LEAD_NOTIFY_FROM || process.env.THANKYOU_FROM || 'Latimore Life & Legacy <leads@latimorelifelegacy.com>';

  const text = `New PAHS consultation request\n\nName: ${lead.name}\nPhone: ${lead.phone}\nEmail: ${lead.email || 'Not provided'}\nPromo/Coupon: ${lead.promo || 'None'}\nInterest: ${lead.interest}\nSource: ${lead.source}\nPage: ${lead.page}`;

  const { error } = await resend.emails.send({
    from,
    to,
    subject: `New PAHS Consultation Request: ${lead.name}`,
    text,
  });

  if (error) throw new Error(`Resend notification failed: ${error.message}`);
  return { skipped: false };
}

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, 'lead')
  if (limited) return limited

  try {
    const body = (await req.json()) as LeadBody

    const lead: ValidatedLead = {
      name: clean(body.name, 150),
      phone: clean(body.phone, 50),
      email: clean(body.email, 150),
      promo: clean(body.promo, 100),
      interest: clean(body.interest, 150),
      source: clean(body.source || 'PAHS Sponsorship Page', 100),
      page: clean(body.page || 'app/pahs', 200),
      bestTime: clean(body.bestTime, 50),
      utmSource: clean(body.utmSource, 100),
      utmMedium: clean(body.utmMedium, 100),
      utmCampaign: clean(body.utmCampaign, 150),
    }

    if (!lead.name || !lead.phone || !lead.interest) {
      return NextResponse.json(
        { ok: false, error: 'Name, phone, and interest are required.' },
        { status: 400 }
      )
    }

    const target = process.env.PAHS_LEAD_TARGET ?? 'crm';

    const [saveResult, emailResult] = await Promise.allSettled([
      target === 'crm' ? saveToCRM(lead) : saveToSupabase(lead),
      sendNotification(lead),
    ])

    const response: Record<string, unknown> = { ok: true }

    if (saveResult.status === 'fulfilled') {
      response.save = saveResult.value;
    } else {
      logger.error({ err: saveResult.reason }, '[pahs-lead] CRM/Supabase save failed');
      response.save = { ok: false, error: String(saveResult.reason) };
    }

    if (emailResult.status === 'fulfilled') {
      response.email = { ok: true, result: emailResult.value }
    } else {
      logger.error({ err: emailResult.reason }, '[pahs-lead] Email notification failed');
      response.email = { ok: false, error: String(emailResult.reason) };
    }

    return NextResponse.json(response)
  } catch (error) {
    logger.error(
      { err: error instanceof Error ? error.message : String(error) },
      '[pahs-lead] submission error'
    )
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Lead submission failed.' },
      { status: 500 }
    )
  }
}
