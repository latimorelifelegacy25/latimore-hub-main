export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminSession } from '@/lib/ai/shared'

/**
 * Real data for the Social OS dashboard. Everything here comes from the live
 * database: AnalyticsDailyMetric (aggregation job), SocialAccountMetric (platform
 * sync), SocialPost, SocialConnection and Contact. Nothing is invented; missing
 * data is returned as null/empty so the UI can show an honest empty state.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  const days = Math.min(Math.max(Number(new URL(req.url).searchParams.get('days') ?? '30') || 30, 1), 180)
  const start = new Date()
  start.setUTCHours(0, 0, 0, 0)
  start.setUTCDate(start.getUTCDate() - (days - 1))

  const [daily, accountMetrics, postGroups, connections, contactsByCounty, lastSyncFailure] = await Promise.all([
    prisma.analyticsDailyMetric.findMany({
      where: {
        metricDate: { gte: start },
        metricKey: { in: ['social_click_count', 'social_engagement_count', 'lead_count', 'cta_click_count'] },
      },
      orderBy: { metricDate: 'asc' },
    }),
    prisma.socialAccountMetric.findMany({
      where: { metricDate: { gte: start } },
      orderBy: { metricDate: 'asc' },
    }),
    prisma.socialPost.groupBy({ by: ['platform', 'status'], _count: { _all: true } }),
    prisma.socialConnection.findMany({
      select: { provider: true, accountName: true, externalId: true, status: true, tokenExpiresAt: true },
    }),
    prisma.contact.groupBy({ by: ['county'], _count: { _all: true } }),
    prisma.analyticsJobRun.findFirst({
      where: { jobKey: 'social_account_metrics_sync', status: 'failed' },
      orderBy: { startedAt: 'desc' },
      select: { startedAt: true, error: true },
    }),
  ])

  // Daily series keyed by date.
  const series = new Map<string, { date: string; engagement: number; clicks: number; leads: number }>()
  for (const row of daily) {
    const date = row.metricDate.toISOString().slice(0, 10)
    const entry = series.get(date) ?? { date, engagement: 0, clicks: 0, leads: 0 }
    const value = Number(row.value)
    if (row.metricKey === 'social_engagement_count') entry.engagement = value
    if (row.metricKey === 'social_click_count') entry.clicks = value
    if (row.metricKey === 'lead_count') entry.leads = value
    series.set(date, entry)
  }
  const trend = [...series.values()]

  const sum = (key: 'engagement' | 'clicks' | 'leads') => trend.reduce((total, d) => total + d[key], 0)

  // Latest platform account snapshot per provider (followers/impressions come from Meta sync).
  const latestByProvider = new Map<string, (typeof accountMetrics)[number]>()
  for (const row of accountMetrics) latestByProvider.set(row.provider, row)
  const impressions = accountMetrics.reduce((total, row) => total + row.impressions, 0)

  const platforms = Array.from(
    new Map(connections.map((c) => [c.provider, c])).keys(),
  ).map((provider) => {
    const rows = connections.filter((c) => c.provider === provider)
    // A provider is connected if ANY of its rows is connected (duplicate/stale rows must not mask it).
    const live = rows.find((c) => c.status === 'connected') ?? rows[0]
    const latest = latestByProvider.get(provider)
    return {
      provider,
      accountName: live.accountName,
      connected: rows.some((c) => c.status === 'connected'),
      followers: latest?.followers ?? null,
      lastMetricDate: latest?.metricDate.toISOString() ?? null,
    }
  })

  const posts = postGroups.reduce(
    (acc, g) => {
      acc.total += g._count._all
      acc.byStatus[g.status] = (acc.byStatus[g.status] ?? 0) + g._count._all
      return acc
    },
    { total: 0, byStatus: {} as Record<string, number> },
  )

  return NextResponse.json({
    ok: true,
    days,
    totals: {
      impressions: impressions > 0 ? impressions : null,
      engagement: sum('engagement'),
      clicks: sum('clicks'),
      leads: sum('leads'),
    },
    trend,
    platforms,
    posts,
    counties: contactsByCounty
      .map((c) => ({ county: c.county ?? 'Unknown', contacts: c._count._all }))
      .sort((a, b) => b.contacts - a.contacts),
    syncHealth: lastSyncFailure
      ? { lastFailureAt: lastSyncFailure.startedAt.toISOString(), error: lastSyncFailure.error }
      : null,
  })
}
