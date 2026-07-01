export const dynamic = 'force-dynamic'
export { handleOptions as OPTIONS } from '@/lib/hub/cors'
import { NextRequest, NextResponse } from 'next/server'
import { withCors } from '@/lib/hub/cors'
import { upsertLead } from '@/lib/hub/upsert-lead'
import { rateLimit } from '@/lib/rate-limit'
import { LeadSchema } from '@/lib/schemas'
import { logger } from '@/lib/logger'
import { sendMetaLeadConversion } from '@/lib/tracking/server-conversions'
import crypto from 'node:crypto'

export const POST = withCors(async (req: NextRequest) => {
  const limited = await rateLimit(req, 'lead')
  if (limited) return limited

  const body = await req.json().catch(() => null)
  const parse = LeadSchema.safeParse(body)
  if (!parse.success) return NextResponse.json({ ok: false, error: parse.error.flatten() }, { status: 422 })

  try {
    const conversionEventId = crypto.randomUUID()
    const { contact, inquiry } = await upsertLead({
      ...parse.data,
      metadata: {
        ...(parse.data.metadata ?? {}),
        conversionEventId,
      },
    })
    await sendMetaLeadConversion({
      eventId: conversionEventId,
      email: parse.data.email ?? null,
      phone: parse.data.phone ?? null,
      eventSourceUrl: parse.data.landingPage ?? req.headers.get('referer'),
      userAgent: req.headers.get('user-agent'),
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip'),
      source: parse.data.source ?? null,
      campaign: parse.data.campaign ?? null,
    })
    return NextResponse.json({ ok: true, contactId: contact.id, inquiryId: inquiry.id, conversionEventId })
  } catch (err: any) {
    logger.error({ err: err.message }, 'Lead ingest error')
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
})
