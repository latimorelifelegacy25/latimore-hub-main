// app/api/reports/events/route.ts
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { getCrmEvents } from '@/lib/reporting'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  const [limited, session] = await Promise.all([
    rateLimit(req, 'reports'),
    getServerSession(authOptions)
  ])

  if (limited) return limited
  if (!session) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

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
