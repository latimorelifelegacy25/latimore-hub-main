export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { analyticsDimensions, analyticsFilterSchema, parseAnalyticsDateRange } from '@/lib/analytics/contracts'
import {
  getAiAnalytics,
  getAnalyticsBreakdowns,
  getAnalyticsFunnel,
  getAnalyticsOpportunities,
  getAnalyticsOverview,
  getAnalyticsTimeSeries,
  getDataQualityWarnings,
  getRecentBusinessEvents,
  isOperationalAnalyticsFallbackEnabled,
} from '@/lib/analytics/queries'
import { logger } from '@/lib/logger'

const DASHBOARD_CACHE_TTL_MS = 30_000

type CachedDashboard = {
  expiresAt: number
  response: unknown
}

const dashboardCache = new Map<string, CachedDashboard>()

function uniqueWarnings(warnings: string[]) {
  return Array.from(new Set(warnings.filter(Boolean)))
}

function getCacheKey(req: NextRequest) {
  return req.nextUrl.searchParams.toString() || 'default'
}

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

  const metricsParam = req.nextUrl.searchParams.get('metrics')
  const metricKeys = metricsParam
    ? metricsParam.split(',').map(metric => metric.trim()).filter(Boolean)
    : ['lead_count', 'contact_count', 'appointment_booked_count', 'cta_click_count']

  const dimension = req.nextUrl.searchParams.get('dimension') ?? 'source'
  if (!analyticsDimensions.includes(dimension as any)) {
    return NextResponse.json({ ok: false, error: `Invalid dimension. Must be one of: ${analyticsDimensions.join(', ')}` }, { status: 400 })
  }

  const recentLimitParam = req.nextUrl.searchParams.get('recentLimit') ?? req.nextUrl.searchParams.get('limit')
  const recentLimit = recentLimitParam ? Math.min(100, Math.max(1, parseInt(recentLimitParam, 10) || 15)) : 15

  const cacheKey = getCacheKey(req)
  const cached = dashboardCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.response)
  }

  try {
    const { from, to } = parseAnalyticsDateRange(parsed.data)
    const [overview, funnel, timeSeries, breakdowns, recentEvents, opportunities, ai, warnings] = await Promise.all([
      getAnalyticsOverview(parsed.data),
      getAnalyticsFunnel(parsed.data),
      getAnalyticsTimeSeries(parsed.data, metricKeys),
      getAnalyticsBreakdowns(parsed.data, dimension),
      getRecentBusinessEvents(recentLimit),
      getAnalyticsOpportunities(),
      getAiAnalytics(parsed.data),
      getDataQualityWarnings(parsed.data),
    ])

    const sources = [overview.source, funnel.source, timeSeries.source, breakdowns.source]
    const response = {
      ok: true,
      range: { from: from.toISOString(), to: to.toISOString() },
      data: {
        overview: overview.data,
        funnel: funnel.data,
        timeSeries: timeSeries.data,
        breakdowns: breakdowns.data,
        recentEvents,
        opportunities,
        ai,
      },
      meta: {
        generatedAt: new Date().toISOString(),
        source: sources.includes('operational_fallback') ? 'mixed' : 'analytics_mart',
        sources: {
          overview: overview.source,
          funnel: funnel.source,
          timeSeries: timeSeries.source,
          breakdowns: breakdowns.source,
          recentEvents: isOperationalAnalyticsFallbackEnabled() ? 'operational_fallback' : 'disabled',
          opportunities: isOperationalAnalyticsFallbackEnabled() ? 'operational_fallback' : 'disabled',
          ai: 'operational_fallback',
        },
        warnings: uniqueWarnings(warnings),
      },
    }

    dashboardCache.set(cacheKey, {
      expiresAt: Date.now() + DASHBOARD_CACHE_TTL_MS,
      response,
    })

    return NextResponse.json(response)
  } catch (err) {
    logger.error({ err }, 'analytics/v1/dashboard error')
    return NextResponse.json({ ok: false, error: 'Failed to load dashboard analytics data.' }, { status: 500 })
  }
}
