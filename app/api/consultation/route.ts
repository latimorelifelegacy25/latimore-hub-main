export const dynamic = 'force-dynamic'
export { handleOptions as OPTIONS } from '@/lib/hub/cors'
import { NextRequest, NextResponse } from 'next/server'
import { withCors } from '@/lib/hub/cors'
import { upsertLead } from '@/lib/hub/upsert-lead'
import { rateLimit } from '@/lib/rate-limit'
import { LeadSchema } from '@/lib/schemas'
import { logger } from '@/lib/logger'
import { requiredEnv } from '@/lib/required-env'
import { sendGoogleChatMessage } from '@/lib/google-chat'

export const POST = withCors(async (req: NextRequest) => {
  const limited = await rateLimit(req, 'fillout')
  if (limited) return limited

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })

  // Map flat form fields to LeadSchema shape
  const [firstName, ...rest] = (body.name ?? '').trim().split(/\s+/)
  const lastName = rest.join(' ') || undefined

  const parse = LeadSchema.safeParse({
    firstName: firstName || undefined,
    lastName: lastName || undefined,
    email: body.email || undefined,
    phone: body.phone || undefined,
    notes: body.message || undefined,
    source: body.source || body.utm_source || undefined,
    medium: body.utm_medium || undefined,
    campaign: body.utm_campaign || undefined,
    content: body.utm_content || undefined,
    term: body.utm_term || undefined,
    landingPage: body.page_path || undefined,
    referrer: body.referrer || undefined,
  })

  if (!parse.success) {
    return NextResponse.json({ ok: false, error: parse.error.flatten() }, { status: 422 })
  }

  try {
    requiredEnv('SUPABASE_SERVICE_ROLE_KEY')
    requiredEnv('LEAD_NOTIFY_EMAIL')
    const { contact, inquiry } = await upsertLead(parse.data)
    await sendGoogleChatMessage(`New consultation lead\n\nName: ${[contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Not provided'}\nEmail: ${contact.email || 'Not provided'}\nPhone: ${contact.phone || 'Not provided'}\nSource: ${parse.data.source || 'website'}\nCampaign: ${parse.data.campaign || 'Not provided'}`)
    return NextResponse.json({ ok: true, leadId: inquiry.id, contactId: contact.id, inquiryId: inquiry.id }, { status: 200 })
  } catch (err: any) {
    logger.error({ err: err.message }, 'Consultation form ingest error')
    return NextResponse.json({ ok: false, error: 'Lead capture failed', detail: err.message }, { status: 500 })
  }
})
