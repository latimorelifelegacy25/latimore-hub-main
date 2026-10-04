// app/api/reports/events/route.ts
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/ai/shared'
import { rateLimit } from '@/lib/rate-limit'
import { getCrmEvents } from '@/lib/reporting'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  const [limited, auth] = await Promise.all([
    rateLimit(req, 'reports'),
    requireAdminSession(),
  ])

  if (limited) return limited
  if (!auth.ok) return auth.response

  try {
    const { items, count } = await getCrmEvents(100)
    return NextResponse.json({ ok: true, items, count })
  } catch (error) {
    logger.error(
      { err: error instanceof Error ? error.message : String(error) },
      '[reports] recent events error'
    )

    return NextResponse.json(
      { ok: false, items: [], count: 0, error: 'failed to load recent events' },
      { status: 500 }
    )
  }
}
