export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { rebuildAnalyticsRange } from '@/lib/analytics/aggregation'
import { assertAnalyticsOverviewCoverage } from '@/lib/analytics/mart-health'
import { logger } from '@/lib/logger'

function isCronAuthed(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const header =
    req.headers.get('x-cron-secret') ??
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  return header === secret
}

function trailingWindow(days: number) {
  const to = new Date()
  const from = new Date(to)
  from.setUTCDate(from.getUTCDate() - (days - 1))
  from.setUTCHours(0, 0, 0, 0)
  to.setUTCHours(23, 59, 59, 999)
  return { from, to }
}

export async function POST(req: NextRequest) {
  // Accept cron secret OR admin session
  const cronOk = isCronAuthed(req)
  if (!cronOk) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const limited = await rateLimit(req, 'analytics')
  if (limited) return limited

  try {
    let body: Record<string, unknown> = {}
    try {
      body = await req.json()
    } catch {
      // no body is fine — use defaults
    }

    const { from, to, days } = body as { from?: string; to?: string; days?: number }

    if (from && to) {
      const fromDate = new Date(from)
      const toDate = new Date(to)
      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        return NextResponse.json({ ok: false, error: 'Invalid from/to dates.' }, { status: 400 })
      }

      await rebuildAnalyticsRange({ from: fromDate, to: toDate })
      const coverage = await assertAnalyticsOverviewCoverage({ from: fromDate, to: toDate })

      return NextResponse.json({
        ok: true,
        message: `Analytics rebuilt for ${from} → ${to}`,
        coverage,
      })
    }

    // Default: trailing N days (default 7; capped to 90 for a single request).
    const requestedDays = typeof days === 'number' && Number.isFinite(days) && days > 0 ? Math.floor(days) : 7
    const trailingDays = Math.min(requestedDays, 90)
    const window = trailingWindow(trailingDays)

    await rebuildAnalyticsRange(window)
    const coverage = await assertAnalyticsOverviewCoverage(window)

    return NextResponse.json({
      ok: true,
      message: `Analytics rebuilt for trailing ${trailingDays} days.`,
      coverage,
    })
  } catch (err) {
    logger.error({ err }, 'analytics/v1/jobs/run POST error')
    return NextResponse.json({ ok: false, error: 'Analytics rebuild or coverage verification failed.' }, { status: 500 })
  }
}
