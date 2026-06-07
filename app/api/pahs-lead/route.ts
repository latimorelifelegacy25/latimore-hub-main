export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { upsertLead } from '@/lib/hub/upsert-lead'
import { sendMail } from '@/lib/mailer'
import { logger } from '@/lib/logger'
import { createClient } from '@supabase/supabase-js'
import { cleanString } from '@/lib/hub/normalizers'

type LeadBody = {
  name?: string | null
  phone?: string | null
  email?: string | null
  promo?: string | null
  interest?: string | null
  source?: string | null
  page?: string | null
}

type ValidatedLead = {
  name: string
  phone: string
  email: string
  promo: string
  interest: string
  source: string
  page: string
}

function clean(value: string | null | undefined, max: number): string {
  return cleanString(value, max) ?? ''
}

async function saveToCRM(lead: ValidatedLead) {
  const nameParts = lead.name.trim().split(/\s+/)
  const firstName = nameParts[0] ?? ''
  const lastName = nameParts.slice(1).join(' ') || undefined

  return upsertLead({
    firstName,
    lastName,
    email: lead.email || undefined,
    phone: lead.phone || undefined,
    productInterest: lead.interest || undefined,
    source: lead.source || 'PAHS Sponsorship Page',
    landingPage: lead.page || 'app/pahs',
    notes: lead.promo ? `Promo: ${lead.promo}` : undefined,
  })
}

async function saveToSupabase(lead: ValidatedLead) {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const table = process.env.PAHS_LEADS_TABLE ?? 'pahs_leads'

  if (!url || !key) {
    return { ok: false, skipped: true, reason: 'Supabase env vars not configured' }
  }

  const client = createClient(url, key)
  const { data, error } = await client.from(table).insert({
    name: lead.name,
    phone: lead.phone,
    email: lead.email || null,
    promo: lead.promo || null,
    interest: lead.interest,
    source: lead.source,
    page: lead.page,
    created_at: new Date().toISOString(),
  })

  if (error) throw error
  return { ok: true, data }
}

async function sendNotification(lead: ValidatedLead) {
  const to = process.env.NOTIFY_TO ?? process.env.LEAD_NOTIFY_TO
  const from = process.env.THANKYOU_FROM ?? process.env.LEAD_NOTIFY_FROM ?? 'noreply@latimorelifelegacy.com'

  if (!to) {
    return { ok: false, skipped: true, reason: 'NOTIFY_TO not configured' }
  }

  return sendMail({
    to,
    from,
    subject: `New PAHS Lead: ${lead.name}`,
    html: `
      <p><strong>Name:</strong> ${lead.name}</p>
      <p><strong>Phone:</strong> ${lead.phone}</p>
      <p><strong>Email:</strong> ${lead.email || 'N/A'}</p>
      <p><strong>Interest:</strong> ${lead.interest}</p>
      <p><strong>Source:</strong> ${lead.source}</p>
      <p><strong>Page:</strong> ${lead.page}</p>
      ${lead.promo ? `<p><strong>Promo:</strong> ${lead.promo}</p>` : ''}
    `.trim(),
  })
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
    }

    if (!lead.name || !lead.phone || !lead.interest) {
      return NextResponse.json(
        { ok: false, error: 'Name, phone, and interest are required.' },
        { status: 400 }
      )
    }

    const [crmResult, supabaseResult, emailResult] = await Promise.allSettled([
      saveToCRM(lead),
      saveToSupabase(lead),
      sendNotification(lead),
    ])

    const response: Record<string, unknown> = { ok: true }

    if (crmResult.status === 'fulfilled') {
      response.crm = { ok: true, result: crmResult.value }
    } else {
      logger.error({ err: crmResult.reason }, '[pahs-lead] CRM save failed')
      response.crm = { ok: false, error: String(crmResult.reason) }
    }

    if (supabaseResult.status === 'fulfilled') {
      response.supabase = supabaseResult.value
    } else {
      logger.error({ err: supabaseResult.reason }, '[pahs-lead] Supabase save failed')
      response.supabase = { ok: false, error: String(supabaseResult.reason) }
    }

    if (emailResult.status === 'fulfilled') {
      response.email = { ok: true, result: emailResult.value }
    } else {
      logger.error({ err: emailResult.reason }, '[pahs-lead] Email notification failed')
      response.email = { ok: false, error: String(emailResult.reason) }
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
