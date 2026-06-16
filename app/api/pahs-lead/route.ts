import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { upsertLead } from '@/lib/hub/upsert-lead';
import { createGoogleCalendarEvent } from '@/lib/calendar/events';
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

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function leadSummary(lead: ValidatedLead, crm?: { contact: string; inquiry: string }) {
  return [
    `Name: ${lead.name}`,
    `Phone: ${lead.phone}`,
    `Email: ${lead.email || 'Not provided'}`,
    `Interest: ${lead.interest}`,
    `Best time: ${lead.bestTime || 'No preference'}`,
    `Promo/Coupon: ${lead.promo || 'None'}`,
    `Source: ${lead.source}`,
    `Page: ${lead.page}`,
    crm?.contact ? `CRM Contact: ${crm.contact}` : null,
    crm?.inquiry ? `CRM Inquiry: ${crm.inquiry}` : null,
  ].filter(Boolean).join('\n');
}

function followUpWindow(bestTime: string) {
  const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const pref = bestTime.toLowerCase();
  if (start.getDay() === 0) start.setDate(start.getDate() + 1);
  if (start.getDay() === 6) start.setDate(start.getDate() + 2);
  if (pref.includes('morning')) start.setHours(9, 0, 0, 0);
  else if (pref.includes('afternoon')) start.setHours(14, 0, 0, 0);
  else if (pref.includes('evening')) start.setHours(17, 0, 0, 0);
  else start.setHours(9, 30, 0, 0);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
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
    metadata: { form: 'pahs-lead', promo: lead.promo || null, bestTime: lead.bestTime || null },
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

async function sendNotification(lead: ValidatedLead, crm?: { contact: string; inquiry: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_NOTIFY_TO || process.env.NOTIFY_TO;
  const from = process.env.LEAD_NOTIFY_FROM || process.env.THANKYOU_FROM;
  if (!apiKey || !to || !from) return { skipped: true, reason: 'Resend notification env vars not configured.' };
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to,
    subject: `New PAHS Consultation Request: ${lead.name}`,
    text: `New PAHS consultation request\n\n${leadSummary(lead, crm)}`,
  });
  if (error) throw new Error(`Resend notification failed: ${error.message}`);
  return { skipped: false };
}

async function createCalendarReminder(lead: ValidatedLead, crm?: { contact: string; inquiry: string }) {
  const window = followUpWindow(lead.bestTime);
  const event = await createGoogleCalendarEvent({
    summary: `Follow up: PAHS Protect - ${lead.name}`,
    description: leadSummary(lead, crm),
    start: window.start,
    end: window.end,
    location: 'Phone/Text follow-up',
  });
  return { skipped: false, eventId: event.id, htmlLink: event.htmlLink ?? null };
}

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, 'lead');
  if (limited) return limited;

  try {
    const body = (await req.json()) as LeadBody;
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
    };

    if (!lead.name || !lead.phone || !lead.interest) {
      return NextResponse.json({ ok: false, error: 'Name, phone, and interest are required.' }, { status: 400 });
    }

    const save = process.env.PAHS_LEAD_TARGET === 'supabase' ? await saveToSupabase(lead) : await saveToCRM(lead);
    const crm = 'contact' in save && 'inquiry' in save ? save : undefined;
    const [email, calendar] = await Promise.allSettled([sendNotification(lead, crm), createCalendarReminder(lead, crm)]);

    if (email.status === 'rejected') logger.error({ err: errorMessage(email.reason) }, '[pahs-lead] email failed');
    if (calendar.status === 'rejected') logger.error({ err: errorMessage(calendar.reason) }, '[pahs-lead] calendar failed');

    return NextResponse.json({
      ok: true,
      save,
      email: email.status === 'fulfilled' ? { ok: true, result: email.value } : { ok: false, error: errorMessage(email.reason) },
      calendar: calendar.status === 'fulfilled' ? { ok: true, result: calendar.value } : { ok: false, error: errorMessage(calendar.reason) },
    });
  } catch (error) {
    logger.error({ err: errorMessage(error) }, '[pahs-lead] submission error');
    return NextResponse.json({ ok: false, error: errorMessage(error) }, { status: 500 });
  }
}
