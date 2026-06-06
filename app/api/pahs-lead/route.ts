import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { upsertLead } from '@/lib/hub/upsert-lead';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { upsertLead } from '@/lib/hub/upsert-lead'
import { cleanString } from '@/lib/hub/normalizers'
import { sendMail } from '@/lib/mailer'
import { logger } from '@/lib/logger'

type LeadBody = {
  name?: string | null
  phone?: string | null
  email?: string | null
  promo?: string | null
  interest?: string | null
  source?: string | null
  page?: string | null
}

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, 'lead')
  if (limited) return limited

  try {
    const body = (await req.json()) as LeadBody

    const name = cleanString(body.name, 150) ?? ''
    const phone = cleanString(body.phone, 50) ?? ''
    const email = cleanString(body.email, 150)
    const interest = cleanString(body.interest, 150) ?? ''
    const source = cleanString(body.source, 100) ?? 'PAHS Sponsorship Page'
    const page = cleanString(body.page, 200) ?? 'pahs.latimorelifelegacy.com'
    const promo = cleanString(body.promo, 100)

    if (!name || !phone || !interest) {
      return NextResponse.json(
        { ok: false, error: 'Name, phone, and interest are required.' },
        { status: 400 }
      )
    }

    const [firstName, ...rest] = name.split(' ')
    const lastName = rest.join(' ') || undefined

    const [saveResult, emailResult] = await Promise.allSettled([
      upsertLead({
        firstName,
        lastName,
        phone,
        email,
        productInterest: interest,
        source,
        landingPage: page,
        notes: promo ? `Promo: ${promo}` : undefined,
      }),
      sendMail({
        to: process.env.NOTIFY_TO ?? '',
        from: process.env.THANKYOU_FROM ?? 'noreply@latimorelifelegacy.com',
        subject: `New PAHS Lead: ${name}`,
        html: `<p><strong>Name:</strong> ${name}</p>
<p><strong>Phone:</strong> ${phone}</p>
${email ? `<p><strong>Email:</strong> ${email}</p>` : ''}
<p><strong>Interest:</strong> ${interest}</p>
<p><strong>Source:</strong> ${source}</p>
<p><strong>Page:</strong> ${page}</p>
${promo ? `<p><strong>Promo:</strong> ${promo}</p>` : ''}`,
      }),
    ])

    const response: Record<string, unknown> = { ok: true }

    if (saveResult.status === 'fulfilled') {
      response.contactId = saveResult.value.contact.id
      response.inquiryId = saveResult.value.inquiry.id
    } else {
      logger.error({ err: saveResult.reason }, '[pahs-lead] CRM save failed')
      response.save = { ok: false, error: String(saveResult.reason) }
    }

    if (emailResult.status === 'rejected') {
      logger.error({ err: emailResult.reason }, '[pahs-lead] Email notification failed')
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
