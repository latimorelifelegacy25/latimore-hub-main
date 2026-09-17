export const dynamic = 'force-dynamic'
export { handleOptions as OPTIONS } from '@/lib/hub/cors'
import { NextRequest, NextResponse } from 'next/server'
import { withCors } from '@/lib/hub/cors'
import { extractAttribution } from '@/lib/hub/extract-attribution'
import { ingestEvent } from '@/lib/hub/ingest-event'
import { EventIngestSchema } from '@/lib/schemas'
import { rateLimit } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'
import { captureException } from '@/lib/error-tracking'

export const POST = withCors(async (req: NextRequest) => {
  const limited = await rateLimit(req, 'event')
  if (limited) return limited

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Malformed JSON body' }, { status: 400 })
  }

  const parsed = EventIngestSchema.safeParse(body)
  if (!parsed.success) {
    const payloadKeys = body && typeof body === 'object' && !Array.isArray(body)
      ? Object.keys(body as Record<string, unknown>)
      : []

    logger.warn(
      { issues: parsed.error.issues, payloadKeys },
      'Rejected invalid analytics event payload',
    )

    return NextResponse.json(
      { ok: false, error: 'Invalid event payload', issues: parsed.error.flatten() },
      { status: 422 },
    )
  }

  const input = parsed.data
  const attr = extractAttribution(input)
  const metadata = {
    ...(input.metadata ?? {}),
    ...(input.term != null ? { term: input.term } : {}),
    ...(input.content != null ? { content: input.content } : {}),
  }

  try {
    const event = await ingestEvent({
      eventType: input.eventType,
      occurredAt: input.occurredAt,
      leadSessionId: input.leadSessionId ?? null,
      contactId: input.contactId ?? null,
      inquiryId: input.inquiryId ?? null,
      pageUrl: attr.landingPage,
      referrer: attr.referrer,
      source: attr.source,
      medium: attr.medium,
      campaign: attr.campaign,
      county: attr.county,
      productInterest: input.productInterest ?? null,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    })

    return NextResponse.json({
      ok: true,
      eventId: event.id,
      sessionId: event.leadSessionId ?? null,
    })
  } catch (err) {
    await captureException(err, { source: 'api', route: '/api/event' })
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
})
