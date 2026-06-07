export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { analyticsFilterSchema, parseAnalyticsDateRange } from '@/lib/analytics/contracts'
import {
  getAnalyticsOverview,
  getAnalyticsFunnel,
  getAnalyticsTimeSeries,
  getAnalyticsBreakdowns,
  getRecentBusinessEvents,
  getAnalyticsOpportunities,
  getDataQualityWarnings,
} from '@/lib/analytics/queries'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const limited = await rateLimit(req, 'analytics')
  if (limited) return limited

  const params = Object.fromEntries(req.nextUrl.searchParams.entries())
  const parsed = analyticsFilterSchema.safeParse(params)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid params' }, { status: 400 })
  }

  try {
    const { from, to } = parseAnalyticsDateRange(parsed.data)
    const [overview, funnel, timeSeries, breakdowns, recentEvents, opportunities, warnings] = await Promise.all([
      getAnalyticsOverview(parsed.data),
      getAnalyticsFunnel(parsed.data),
      getAnalyticsTimeSeries(parsed.data, ['lead_count', 'contact_count', 'appointment_booked_count', 'cta_click_count']),
      getAnalyticsBreakdowns(parsed.data, 'source'),
      getRecentBusinessEvents(15),
      getAnalyticsOpportunities(),
      getDataQualityWarnings(parsed.data),
    ])

    const sources = Array.from(new Set([overview.source, funnel.source, timeSeries.source, breakdowns.source]))

    return NextResponse.json({
      ok: true,
      range: { from: from.toISOString(), to: to.toISOString() },
      data: {
        overview: overview.data,
        funnel: funnel.data,
        timeSeries: timeSeries.data,
        breakdowns: breakdowns.data,
        recentEvents,
        opportunities,
      },
      meta: {
        generatedAt: new Date().toISOString(),
        source: sources.join(','),
        warnings,
      },
    })
  } catch (err) {
    logger.error({ err }, 'analytics/v1/dashboard error')
    return NextResponse.json({ ok: false, error: 'Failed to load dashboard analytics.' }, { status: 500 })
  }
}
