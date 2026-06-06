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
  getAnalyticsOpportunities,
  getRecentBusinessEvents,
  getDataQualityWarnings,
} from '@/lib/analytics/queries'
import { logger } from '@/lib/logger'

const DEFAULT_METRICS = ['lead_count', 'contact_count', 'appointment_booked_count', 'cta_click_count']

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

    const [
      overviewResult,
      funnelResult,
      timeSeriesResult,
      breakdownsResult,
      opportunities,
      recentEvents,
      warnings,
    ] = await Promise.all([
      getAnalyticsOverview(parsed.data),
      getAnalyticsFunnel(parsed.data),
      getAnalyticsTimeSeries(parsed.data, DEFAULT_METRICS),
      getAnalyticsBreakdowns(parsed.data, 'source'),
      getAnalyticsOpportunities(),
      getRecentBusinessEvents(15),
      getDataQualityWarnings(parsed.data),
    ])

    const rangePayload = { from: from.toISOString(), to: to.toISOString() }
    const generatedAt = new Date().toISOString()

    return NextResponse.json({
      ok: true,
      generatedAt,
      range: rangePayload,
      warnings,
      overview: overviewResult.data,
      funnel: funnelResult.data,
      timeSeries: timeSeriesResult.data,
      breakdowns: breakdownsResult.data,
      opportunities,
      recentEvents,
    })
  } catch (err) {
    logger.error({ err }, 'analytics/v1/dashboard error')
    return NextResponse.json({ ok: false, error: 'Failed to load dashboard data.' }, { status: 500 })
  }
}
