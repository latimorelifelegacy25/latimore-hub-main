export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { upsertLead } from '@/lib/hub/upsert-lead';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';
import { claimWebhookEvent } from '@/lib/hub/webhook-idempotency';
import { captureException } from '@/lib/error-tracking';
import { LeadSchema } from '@/lib/schemas';
import { ZodError } from 'zod';
import crypto from 'crypto';

import { GET as canonicalGet, POST as canonicalPost } from '@/app/api/webhooks/fillout/route'

type FilloutQuestion = { name: string; value: unknown };
type FilloutUrlParam = { id: string; value: unknown };
type FilloutPayload = { submissionId?: string; submissionTime?: string; questions?: FilloutQuestion[]; urlParameters?: FilloutUrlParam[] };

function field(questions: FilloutQuestion[], ...names: string[]): string {
  for (const name of names) {
    const q = questions.find(q => q.name.toLowerCase() === name.toLowerCase());
    if (q && q.value != null) return String(q.value).trim().slice(0, 500);
  }
  return '';
}

function param(urlParams: FilloutUrlParam[], id: string): string {
  const p = urlParams.find(p => p.id.toLowerCase() === id.toLowerCase());
  return p?.value != null ? String(p.value).trim().slice(0, 150) : '';
}

async function legacySupabaseMirror(input: {
  fullName: string;
  phone: string;
  email: string;
  interest: string;
  county: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm?: string;
  utmContent?: string;
  landingPage: string;
  notes: string;
}) {
  if (process.env.FILLOUT_LEGACY_SUPABASE_SYNC !== 'true') return

  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supaUrl || !supaKey) return

  const supabase = createClient(supaUrl, supaKey, { auth: { persistSession: false } });
  const { error } = await supabase.from('leads').insert({
    full_name: input.fullName || 'Unknown',
    phone: input.phone || null,
    email: input.email || null,
    product_interest: input.interest || null,
    lead_source: 'PAHS Fillout Form',
    page_source: input.landingPage,
    status: 'New',
    county: input.county || null,
    utm_source: input.utmSource,
    utm_medium: input.utmMedium,
    utm_campaign: input.utmCampaign,
    utm_term: input.utmTerm || null,
    utm_content: input.utmContent || null,
    notes: input.notes,
  });
  if (error) logger.error({ error: error.message }, 'Legacy Supabase mirror insert error');
}

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, 'fillout')
  if (limited) return limited

  try {
    const body = (await req.json()) as FilloutPayload;

    const eventId = body.submissionId ?? crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
    if (!(await claimWebhookEvent('fillout-pahs', eventId))) {
      return NextResponse.json({ ok: true, deduped: true });
    }

    const questions: FilloutQuestion[] = body.questions ?? [];
    const urlParams: FilloutUrlParam[] = body.urlParameters ?? [];

    const firstName = field(questions, 'First name', 'First Name');
    const lastName = field(questions, 'Last name', 'Last Name');
    const fullName = [firstName, lastName].filter(Boolean).join(' ') || field(questions, 'Full name', 'Full Name', 'Name');
    const email = field(questions, 'Email address', 'Email');
    const phone = field(questions, 'Phone number', 'Phone');
    const county = field(questions, 'County');
    const interest = field(questions, 'Product interest', 'Interest', 'What are you most interested in?');
    const address = [
      field(questions, 'Mailing address', 'Address'),
      field(questions, 'City'),
      field(questions, 'State'),
      field(questions, 'ZIP', 'Zip'),
    ].filter(Boolean).join(', ');
    const dob = field(questions, 'Date of birth', 'DOB');

    const utmSource = param(urlParams, 'utm_source') || param(urlParams, 'utmsource') || 'pahs_qr';
    const utmMedium = param(urlParams, 'utm_medium') || param(urlParams, 'utmmedium') || 'qr';
    const utmCampaign = param(urlParams, 'utm_campaign') || param(urlParams, 'utmcampaign') || 'pahs';
    const utmTerm = param(urlParams, 'utm_term') || param(urlParams, 'utmterm') || undefined;
    const utmContent = param(urlParams, 'utm_content') || param(urlParams, 'utmcontent') || undefined;
    const referrer = param(urlParams, 'referrer') || param(urlParams, 'referer') || req.headers.get('referer') || undefined;
    const landingPage = param(urlParams, 'landing_page') || param(urlParams, 'landingpage') || 'latimorelifelegacy.fillout.com/pahs';

    const notes = [
      'Fillout PAHS form submission.',
      address && `Address: ${address}`,
      dob && `DOB: ${dob}`,
      body.submissionId && `Fillout ID: ${body.submissionId}`,
    ].filter(Boolean).join(' ');

    void legacySupabaseMirror({
      fullName,
      phone,
      email,
      interest,
      county,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent,
      landingPage,
      notes,
    }).catch(error => logger.error({ err: error }, 'Legacy Supabase mirror failed'));

    const leadInput = LeadSchema.parse({
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      email: email || null,
      phone: phone || null,
      county: county || null,
      productInterest: interest || null,
      source: utmSource,
      medium: utmMedium,
      campaign: utmCampaign,
      term: utmTerm || null,
      content: utmContent || null,
      referrer: referrer || null,
      landingPage,
      notes,
      metadata: { form: 'fillout-pahs', submissionId: body.submissionId ?? null },
    })
    const { contact, inquiry, deduped } = await upsertLead(leadInput);

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        const resend = new Resend(resendKey);
        const to = process.env.LEAD_NOTIFY_TO || process.env.LEAD_NOTIFY_EMAIL || 'Jackson1989@latimorelegacy.com';
        const from = process.env.LEAD_NOTIFY_FROM || 'Latimore Life & Legacy <leads@latimorelifelegacy.com>';
        await resend.emails.send({
          from,
          to,
          subject: `New PAHS Consultation: ${fullName || 'Unknown'}`,
          text: `New PAHS Fillout form submission\n\nName: ${fullName}\nPhone: ${phone || 'Not provided'}\nEmail: ${email || 'Not provided'}\nCounty: ${county || 'Not provided'}\nInterest: ${interest || 'Not provided'}\n${address ? `Address: ${address}\n` : ''}${dob ? `DOB: ${dob}\n` : ''}Fillout ID: ${body.submissionId || 'N/A'}`,
        });
      } catch (error) {
        logger.error({ err: error }, '[fillout-webhook] Resend notification failed');
      }
    }

    return NextResponse.json({ ok: true, leadId: inquiry.id, contactId: contact.id, inquiryId: inquiry.id, deduped });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ ok: false, error: error.flatten() }, { status: 422 });
    }

    await captureException(error, { source: 'webhook', provider: 'fillout-pahs' });
    return NextResponse.json({ ok: false, error: 'server error' }, { status: 500 });
  }
}
