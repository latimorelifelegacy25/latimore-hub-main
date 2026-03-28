export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { ingestEvent } from '@/lib/hub/ingest-event'
import { rateLimit } from '@/lib/rate-limit'
import { EventIngestSchema } from '@/lib/schemas'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, 'event')
  if (limited) return limited

  const body = await req.json().catch(() => null)
  const parse = EventIngestSchema.safeParse(body)
  if (!parse.success) return NextResponse.json({ ok: false, error: parse.error.flatten() }, { status: 422 })

  try {
    const event = await ingestEvent(parse.data)
    return NextResponse.json({ ok: true, eventId: event.id })
  } catch (err: any) {
    logger.error({ err: err.message }, 'Event ingest error')
    return NextResponse.json({ ok: false, error: 'server error' }, { status: 500 })
  }
}
