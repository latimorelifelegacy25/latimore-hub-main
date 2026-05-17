import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const runtime = 'nodejs';

type LeadBody = {
  name?: string;
  phone?: string;
  email?: string;
  promo?: string;
  interest?: string;
  source?: string;
  page?: string;
};

function clean(value: unknown, max = 500) {
  return String(value || '').trim().slice(0, max);
}

async function saveToSupabase(lead: Required<LeadBody>) {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return { skipped: true, reason: 'Supabase env vars not configured.' };

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { error } = await supabase.from('leads').insert({
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

async function sendNotification(lead: Required<LeadBody>) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { skipped: true, reason: 'RESEND_API_KEY not configured.' };

  const resend = new Resend(apiKey);
  const to = process.env.LEAD_NOTIFY_TO || 'Jackson1989@latimorelegacy.com';
  const from = process.env.LEAD_NOTIFY_FROM || 'Latimore Life & Legacy <leads@latimorelifelegacy.com>';

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

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as LeadBody;
    const lead: Required<LeadBody> = {
      name: clean(body.name, 150),
      phone: clean(body.phone, 50),
      email: clean(body.email, 150),
      promo: clean(body.promo, 100),
      interest: clean(body.interest, 150),
      source: clean(body.source || 'PAHS Sponsorship Page', 100),
      page: clean(body.page || 'card.latimorelifelegacy.com/pahs', 200),
    };

    if (!lead.name || !lead.phone || !lead.interest) {
      return NextResponse.json({ ok: false, error: 'Name, phone, and interest are required.' }, { status: 400 });
    }

    const [supabaseResult, emailResult] = await Promise.all([saveToSupabase(lead), sendNotification(lead)]);

    return NextResponse.json({ ok: true, supabase: supabaseResult, email: emailResult });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Lead submission failed.' }, { status: 500 });
  }
}
