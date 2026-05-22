import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { prisma } from '@/lib/prisma'
import { createOpenAIJsonCompletion } from '@/lib/ai/client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const REPORT_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    kpi_highlights: { type: 'array', items: { type: 'string' } },
    top_performing: { type: 'array', items: { type: 'string' } },
    weakest_areas: { type: 'array', items: { type: 'string' } },
    growth_opportunities: { type: 'array', items: { type: 'string' } },
    risks: { type: 'array', items: { type: 'string' } },
    recommended_actions: { type: 'array', items: { type: 'string' } },
    recommended_posts: { type: 'array', items: { type: 'string' } },
  },
  required: ['summary', 'kpi_highlights', 'top_performing', 'weakest_areas', 'growth_opportunities', 'risks', 'recommended_actions', 'recommended_posts'],
  additionalProperties: false,
}

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, 'reports')
  if (limited) return limited

  const isCron = req.headers.get('x-cron-secret') === process.env.CRON_SECRET
  const session = await getServerSession(authOptions)
  if (!isCron && !session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const now = new Date()
  const weekEnd = new Date(now)
  const weekStart = new Date(now)
  weekStart.setDate(weekStart.getDate() - 7)

  const [metrics, insights, posts] = await Promise.all([
    prisma.socialMetric.findMany({ where: { metricDate: { gte: weekStart } } }),
    prisma.insight.findMany({ where: { createdAt: { gte: weekStart } }, take: 20 }),
    prisma.socialPost.findMany({
      where: { publishedAt: { gte: weekStart } },
      include: { metrics: true },
    }),
  ])

  const totals = metrics.reduce(
    (a, m) => ({ impressions: a.impressions + m.impressions, reach: a.reach + m.reach, clicks: a.clicks + m.clicks, reactions: a.reactions + m.reactions, comments: a.comments + m.comments, shares: a.shares + m.shares, leads: a.leads + m.leads }),
    { impressions: 0, reach: 0, clicks: 0, reactions: 0, comments: 0, shares: 0, leads: 0 }
  )

  const engagementRate = totals.reach > 0
    ? (((totals.reactions + totals.comments + totals.shares) / totals.reach) * 100).toFixed(2) + '%'
    : 'N/A'

  const kpiContext = `
Weekly KPIs (${weekStart.toDateString()} – ${weekEnd.toDateString()}):
- Impressions: ${totals.impressions}
- Reach: ${totals.reach}
- Clicks: ${totals.clicks}
- Reactions: ${totals.reactions}
- Comments: ${totals.comments}
- Shares: ${totals.shares}
- New Leads: ${totals.leads}
- Engagement Rate: ${engagementRate}
- Posts Published: ${posts.length}
- Open Insights: ${insights.length}

Top Insights This Week:
${insights.slice(0, 5).map(i => `- [${i.severity}] ${i.title}: ${i.summary}`).join('\n')}

This is for Latimore Life & Legacy LLC, an independent insurance advisor in Central Pennsylvania.
`

  const { output } = await createOpenAIJsonCompletion({
    system: 'You are a marketing intelligence analyst for an insurance advisory firm. Generate a weekly performance report with actionable insights.',
    user: kpiContext,
    schemaName: 'weekly_report',
    schema: REPORT_SCHEMA,
    temperature: 0.4,
  })

  const report = await prisma.weeklyReport.create({
    data: {
      weekStart,
      weekEnd,
      kpis: totals as object,
      insights: (output as { kpi_highlights: string[] }).kpi_highlights as object,
      opportunities: (output as { growth_opportunities: string[] }).growth_opportunities as object,
    },
  })

  return NextResponse.json({ ok: true, report, analysis: output })
}

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const reports = await prisma.weeklyReport.findMany({
    orderBy: { weekStart: 'desc' },
    take: 10,
  })

  return NextResponse.json({ ok: true, reports })
}
