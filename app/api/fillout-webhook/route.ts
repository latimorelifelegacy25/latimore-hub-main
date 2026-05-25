export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const runtime = 'nodejs';

type FilloutQuestion = { name: string; value: unknown };
type FilloutPayload = { submissionId?: string; submissionTime?: string; questions?: FilloutQuestion[] };

function field(questions: FilloutQuestion[], ...names: string[]): string {
  for (const name of names) {
    const q = questions.find(q => q.name.toLowerCase() === name.toLowerCase());
    if (q && q.value != null) return String(q.value).trim().slice(0, 500);
  }
  return '';
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as FilloutPayload;
    const questions: FilloutQuestion[] = body.questions ?? [];

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

    const notes = [
      'Fillout PAHS form submission.',
      address && `Address: ${address}`,
      dob && `DOB: ${dob}`,
      body.submissionId && `Fillout ID: ${body.submissionId}`,
    ].filter(Boolean).join(' ');

    const supaUrl = process.env.SUPABASE_URL;
    const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supaUrl && supaKey) {
      const supabase = createClient(supaUrl, supaKey, { auth: { persistSession: false } });
      const { error } = await supabase.from('leads').insert({
        full_name: fullName || 'Unknown',
        phone: phone || null,
        email: email || null,
        product_interest: interest || null,
        lead_source: 'PAHS Fillout Form',
        page_source: 'latimorelifelegacy.fillout.com/pahs',
        status: 'New',
        county: county || null,
        notes,
      });
      if (error) console.error('Supabase insert error:', error.message);
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const resend = new Resend(resendKey);
      const to = process.env.LEAD_NOTIFY_TO || 'Jackson1989@latimorelegacy.com';
      const from = process.env.LEAD_NOTIFY_FROM || 'Latimore Life & Legacy <leads@latimorelifelegacy.com>';
      await resend.emails.send({
        from,
        to,
        subject: `New PAHS Consultation: ${fullName || 'Unknown'}`,
        text: `New PAHS Fillout form submission\n\nName: ${fullName}\nPhone: ${phone || 'Not provided'}\nEmail: ${email || 'Not provided'}\nCounty: ${county || 'Not provided'}\nInterest: ${interest || 'Not provided'}\n${address ? `Address: ${address}\n` : ''}${dob ? `DOB: ${dob}\n` : ''}\nFillout ID: ${body.submissionId || 'N/A'}`,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Fillout webhook error:', error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
