import { NextRequest, NextResponse } from 'next/server';
import { upsertLead } from '@/lib/hub/upsert-lead';
import { createGoogleCalendarEvent } from '@/lib/calendar/events';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { sendGoogleChatMessage } from '@/lib/google-chat';
import { LeadSchema } from '@/lib/schemas';

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
  state?: string;
  priority?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  referrer?: string;
};

type ValidatedLead = {
  name: string;
  phone: string;
  email: string;
  promo: string;
  interest: string;
  source: string;
  page: string;
  bestTime: string;
  state: string;
  priority: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  utmContent: string;
  referrer: string;
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
    `Source: ${lead.utmSource || lead.source}`,
    `Medium: ${lead.utmMedium || 'Not provided'}`,
    `Campaign: ${lead.utmCampaign || 'Not provided'}`,
    lead.utmTerm ? `Term: ${lead.utmTerm}` : null,
    lead.utmContent ? `Content: ${lead.utmContent}` : null,
    lead.referrer ? `Referrer: ${lead.referrer}` : null,
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
  const { contact, inquiry, deduped } = await upsertLead({
    firstName,
    lastName,
    email: lead.email || null,
    phone: lead.phone,
    productInterest: lead.interest,
    source: lead.utmSource || lead.source,
    medium: lead.utmMedium || null,
    campaign: lead.utmCampaign || null,
    term: lead.utmTerm || null,
    content: lead.utmContent || null,
    referrer: lead.referrer || null,
    landingPage: lead.page,
    notes,
    metadata: {
      form: 'pahs-lead',
      promo: lead.promo || null,
      bestTime: lead.bestTime || null,
      utmTerm: lead.utmTerm || null,
      utmContent: lead.utmContent || null,
      referrer: lead.referrer || null,
    },
  });
  return { contact: contact.id, inquiry: inquiry.id, deduped };
}

async function sendNotification(lead: ValidatedLead) {
  const notifyTo = process.env.LEAD_NOTIFY_EMAIL || process.env.NOTIFY_TO || 'jackson1989@latimorelegacy.com'
  const text = `New PAHS consultation request

Name: ${lead.name}
Phone: ${lead.phone}
Email: ${lead.email}
State: ${lead.state}
Priority: ${lead.priority}
Promo/Coupon: ${lead.promo || 'None'}
Interest: ${lead.interest}
Source: ${lead.utmSource || lead.source}
Medium: ${lead.utmMedium || 'Not provided'}
Campaign: ${lead.utmCampaign || 'Not provided'}
Term: ${lead.utmTerm || 'Not provided'}
Content: ${lead.utmContent || 'Not provided'}
Referrer: ${lead.referrer || 'Not provided'}
Page: ${lead.page}
Notify: ${notifyTo}`

  await sendGoogleChatMessage(text)
  return { skipped: false, channel: 'google_chat' }
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
      state: clean(body.state || 'PA', 50),
      priority: clean(body.priority || 'standard', 50),
      utmSource: clean(body.utmSource || body.utm_source, 100),
      utmMedium: clean(body.utmMedium || body.utm_medium, 100),
      utmCampaign: clean(body.utmCampaign || body.utm_campaign, 150),
      utmTerm: clean(body.utmTerm || body.utm_term, 100),
      utmContent: clean(body.utmContent || body.utm_content, 100),
      referrer: clean(body.referrer || req.headers.get('referer'), 500),
    };

    if (!lead.name || !lead.email || !lead.phone || !lead.state || !lead.priority || !lead.source || !lead.interest) {
      return NextResponse.json(
        { ok: false, error: 'Name, email, phone, state, priority, source, and interest are required.' },
        { status: 400 }
      )
    }

    const leadInput = {
      ...splitName(lead.name),
      email: lead.email || null,
      phone: lead.phone,
      productInterest: lead.interest,
      source: lead.utmSource || lead.source,
      medium: lead.utmMedium || null,
      campaign: lead.utmCampaign || null,
      term: lead.utmTerm || null,
      content: lead.utmContent || null,
      referrer: lead.referrer || null,
      landingPage: lead.page,
      notes: `Coverage interest: ${lead.interest}${lead.bestTime ? ` | Best time to call: ${lead.bestTime}` : ''}${lead.promo ? ` | Promo/Coupon: ${lead.promo}` : ''}`,
    }
    const parsedLead = LeadSchema.safeParse(leadInput)
    if (!parsedLead.success) {
      return NextResponse.json({ ok: false, error: parsedLead.error.flatten() }, { status: 422 })
    }

    const save = await saveToCRM(lead);
    const crm = save;
    const [emailResult, calendarResult] = await Promise.allSettled([
      sendNotification(lead),
      createCalendarReminder(lead, crm),
    ]);

    const response: Record<string, unknown> = {
      ok: true,
      leadId: save.inquiry,
      contactId: save.contact,
      inquiryId: save.inquiry,
      deduped: save.deduped,
      save,
    };

    if (emailResult.status === 'fulfilled') {
      response.email = { ok: true, result: emailResult.value };
    } else {
      logger.error({ err: emailResult.reason }, '[pahs-lead] Google Chat notification failed');
      response.email = { ok: false, error: errorMessage(emailResult.reason) };
    }

    if (calendarResult.status === 'fulfilled') {
      response.calendar = { ok: true, result: calendarResult.value };
    } else {
      logger.error({ err: calendarResult.reason }, '[pahs-lead] Calendar reminder failed');
      response.calendar = { ok: false, error: errorMessage(calendarResult.reason) };
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    logger.error(
      { err: error instanceof Error ? error.message : String(error) },
      '[pahs-lead] submission error'
    )
    return NextResponse.json(
      { ok: false, error: 'Lead capture failed', detail: error instanceof Error ? error.message : 'Lead submission failed.' },
      { status: 500 }
    )
  }
}
