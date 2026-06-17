import { endOfWeek, startOfWeek, subWeeks } from 'date-fns'
import { fromZonedTime, toZonedTime } from 'date-fns-tz'
import type { Prisma, SocialMetric } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export type NormalizedTotals = {
  impressions: number
  reach: number
  clicks: number
  reactions: number
  comments: number
  shares: number
  saves: number
  leads: number
  conversions: number
  revenueCents: number
  engagement: number
  engagementRate: number
  leadRate: number
}

export type DashboardRange = { start: Date; end: Date; platform?: string | null }

const ZERO_TOTALS: NormalizedTotals = {
  impressions: 0,
  reach: 0,
  clicks: 0,
  reactions: 0,
  comments: 0,
  shares: 0,
  saves: 0,
  leads: 0,
  conversions: 0,
  revenueCents: 0,
  engagement: 0,
  engagementRate: 0,
  leadRate: 0,
}

function metricWhere(input: DashboardRange) {
  return {
    metricDate: { gte: input.start, lte: input.end },
    ...(input.platform && input.platform !== 'all' ? { platform: input.platform } : {}),
  }
}

function addMetric(total: NormalizedTotals, metric: SocialMetric): NormalizedTotals {
  const next = {
    ...total,
    impressions: total.impressions + metric.impressions,
    reach: total.reach + metric.reach,
    clicks: total.clicks + metric.clicks,
    reactions: total.reactions + metric.reactions,
    comments: total.comments + metric.comments,
    shares: total.shares + metric.shares,
    saves: total.saves + metric.saves,
    leads: total.leads + metric.leads,
    conversions: total.conversions + metric.conversions,
    revenueCents: total.revenueCents + metric.revenueCents,
  }
  return finalizeTotals(next)
}

function finalizeTotals(total: NormalizedTotals): NormalizedTotals {
  const engagement = total.clicks + total.reactions + total.comments + total.shares + total.saves
  const exposure = total.reach || total.impressions
  return {
    ...total,
    engagement,
    engagementRate: exposure > 0 ? engagement / exposure : 0,
    leadRate: total.clicks > 0 ? total.leads / total.clicks : exposure > 0 ? total.leads / exposure : 0,
  }
}

function summarizeMetrics(metrics: SocialMetric[]): NormalizedTotals {
  return metrics.reduce(addMetric, ZERO_TOTALS)
}

function delta(current: number, previous: number) {
  const absolute = current - previous
  const percent = previous > 0 ? (absolute / previous) * 100 : current > 0 ? 100 : 0
  return { absolute, percent }
}

export function rangeFromDays(days = 30, platform?: string | null): DashboardRange {
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - Math.max(1, Math.min(days, 365)))
  return { start, end, platform: platform === 'all' ? null : platform }
}

export function getPreviousCompletedWeek(timezone = 'America/New_York', now = new Date()) {
  const zonedNow = toZonedTime(now, timezone)
  const previousWeek = subWeeks(zonedNow, 1)
  return {
    weekStart: fromZonedTime(startOfWeek(previousWeek, { weekStartsOn: 1 }), timezone),
    weekEnd: fromZonedTime(endOfWeek(previousWeek, { weekStartsOn: 1 }), timezone),
  }
}

export async function getExecutiveDashboard(input: DashboardRange) {
  const lengthMs = input.end.getTime() - input.start.getTime()
  const previousEnd = new Date(input.start)
  const previousStart = new Date(previousEnd.getTime() - lengthMs)

  const [metrics, previousMetrics, insights] = await Promise.all([
    prisma.socialMetric.findMany({ where: metricWhere(input), orderBy: { metricDate: 'asc' } }),
    prisma.socialMetric.findMany({ where: metricWhere({ start: previousStart, end: previousEnd, platform: input.platform }) }),
    prisma.insight.findMany({ where: { createdAt: { gte: input.start, lte: input.end } }, orderBy: { createdAt: 'desc' }, take: 5 }),
  ])

  const totals = summarizeMetrics(metrics)
  const previousTotals = summarizeMetrics(previousMetrics)
  const trendMap = new Map<string, NormalizedTotals>()
  const platformMap = new Map<string, NormalizedTotals>()

  for (const metric of metrics) {
    const day = metric.metricDate.toISOString().slice(0, 10)
    trendMap.set(day, addMetric(trendMap.get(day) ?? ZERO_TOTALS, metric))
    platformMap.set(metric.platform, addMetric(platformMap.get(metric.platform) ?? ZERO_TOTALS, metric))
  }

  const commentIntel = await getCommentIntelligence(input)

  return {
    range: { start: input.start.toISOString(), end: input.end.toISOString(), platform: input.platform ?? null },
    totals,
    previousTotals,
    deltas: {
      engagement: delta(totals.engagement, previousTotals.engagement),
      clicks: delta(totals.clicks, previousTotals.clicks),
      leads: delta(totals.leads, previousTotals.leads),
      engagementRate: delta(totals.engagementRate, previousTotals.engagementRate),
    },
    trend: [...trendMap.entries()].map(([date, row]) => ({ date, engagement: row.engagement, clicks: row.clicks, leads: row.leads })),
    sentiment: commentIntel.sentiment,
    byPlatform: [...platformMap.entries()].map(([platform, row]) => ({ platform, totals: row })),
    topInsights: insights.map((insight) => ({
      id: insight.id,
      type: insight.type,
      severity: insight.severity,
      title: insight.title,
      summary: insight.summary,
      action: insight.action,
      createdAt: insight.createdAt.toISOString(),
    })),
    nextActions: insights.slice(0, 3).map((insight) => ({ title: insight.action || insight.title, reason: insight.summary, priority: insight.severity })),
  }
}

export async function getPostPerformance(input: DashboardRange) {
  const posts = await prisma.socialPost.findMany({
    where: { metrics: { some: metricWhere(input) } },
    include: { metrics: { where: metricWhere(input) } },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  })

  const cards = posts.map((post) => {
    const totals = summarizeMetrics(post.metrics)
    const ageDays = post.publishedAt ? Math.max(0, (Date.now() - post.publishedAt.getTime()) / 86_400_000) : 30
    const recencyBoost = Math.max(0, 1 - ageDays / 30)
    const score = totals.engagementRate * 40 + totals.leadRate * 30 + (totals.conversions > 0 ? 20 : 0) + recencyBoost * 10
    return {
      id: post.id,
      platform: post.platform,
      caption: post.caption,
      campaign: post.campaign,
      publishedAt: post.publishedAt?.toISOString() ?? null,
      externalPostId: post.externalPostId,
      totals,
      score,
    }
  })

  return {
    topPosts: [...cards].filter((post) => post.totals.reach >= 10 || post.totals.engagement > 0).sort((a, b) => b.score - a.score).slice(0, 6),
    weakPosts: [...cards].filter((post) => post.totals.reach >= 25 && post.totals.engagementRate < 0.01).sort((a, b) => a.totals.engagementRate - b.totals.engagementRate).slice(0, 6),
    posts: cards,
  }
}

export async function getCommentIntelligence(input: DashboardRange) {
  const comments = await prisma.socialComment.findMany({
    where: {
      createdAt: { gte: input.start, lte: input.end },
      ...(input.platform ? { platform: input.platform } : {}),
    },
    include: { analyses: { orderBy: { createdAt: 'desc' }, take: 1 } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const sentiment = { positive: 0, neutral: 0, negative: 0 }
  const mapped = comments.map((comment) => {
    const analysis = comment.analyses[0]
    const body = comment.body
    const lower = body.toLowerCase()
    const detectedLead = /(price|quote|call|appointment|coverage|policy|retirement|final expense|mortgage protection)/i.test(lower)
    const detectedRisk = /(guaranteed approval|tax-free retirement|no risk|never lose money|guaranteed return)/i.test(lower)
    const sentimentKey = (analysis?.sentiment?.toLowerCase() ?? 'neutral') as keyof typeof sentiment
    if (sentimentKey in sentiment) sentiment[sentimentKey] += 1
    else sentiment.neutral += 1
    return {
      id: comment.id,
      platform: comment.platform,
      authorHandle: comment.authorHandle,
      body,
      createdAt: comment.createdAt.toISOString(),
      sentiment: analysis?.sentiment ?? 'neutral',
      intent: analysis?.intent ?? 'general',
      urgency: analysis?.urgency ?? 'low',
      leadPotential: analysis?.leadPotential ?? (detectedLead ? 'high' : 'none'),
      complianceRisk: analysis?.complianceRisk ?? (detectedRisk ? 'high' : 'none'),
      suggestedAction: analysis?.suggestedAction ?? null,
    }
  })

  return {
    sentiment,
    highIntent: mapped.filter((row) => ['high', 'medium'].includes(row.leadPotential)).slice(0, 20),
    complianceRisk: mapped.filter((row) => ['high', 'medium'].includes(row.complianceRisk)).slice(0, 20),
    recent: mapped.slice(0, 25),
  }
}

export async function getTrendingTopics(input: DashboardRange) {
  const [posts, comments] = await Promise.all([
    prisma.socialPost.findMany({ where: { createdAt: { gte: input.start, lte: input.end }, ...(input.platform ? { platform: input.platform } : {}) }, select: { caption: true }, take: 100, orderBy: { createdAt: 'desc' } }),
    prisma.socialComment.findMany({ where: { createdAt: { gte: input.start, lte: input.end }, ...(input.platform ? { platform: input.platform } : {}) }, select: { body: true }, take: 100, orderBy: { createdAt: 'desc' } }),
  ])
  const stop = new Set(['the', 'and', 'for', 'you', 'your', 'with', 'this', 'that', 'from', 'are', 'our', 'can', 'not', 'but', 'have', 'has', 'about'])
  const counts = new Map<string, number>()
  for (const text of [...posts.map((p) => p.caption), ...comments.map((c) => c.body)]) {
    for (const word of text.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/)) {
      if (word.length < 4 || stop.has(word)) continue
      counts.set(word, (counts.get(word) ?? 0) + 1)
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([topic, count]) => ({ topic, count }))
}

export async function getLeadAttribution(input: DashboardRange) {
  const [metrics, inquiries, appointments] = await Promise.all([
    prisma.socialMetric.findMany({ where: metricWhere(input) }),
    prisma.inquiry.findMany({ where: { createdAt: { gte: input.start, lte: input.end } }, select: { source: true, stage: true, status: true } }),
    prisma.appointment.findMany({ where: { createdAt: { gte: input.start, lte: input.end } }, select: { source: true } }),
  ])
  const totals = summarizeMetrics(metrics)
  const byPlatform = new Map<string, { platform: string; leads: number; consultations: number; conversions: number; revenueCents: number }>()
  for (const inquiry of inquiries) {
    const key = inquiry.source || 'unattributed'
    const item = byPlatform.get(key) ?? { platform: key, leads: 0, consultations: 0, conversions: 0, revenueCents: 0 }
    item.leads += 1
    if (inquiry.status === 'CLOSED_WON' || inquiry.stage === 'Sold') item.conversions += 1
    byPlatform.set(key, item)
  }
  for (const appointment of appointments) {
    const key = appointment.source || 'unattributed'
    const item = byPlatform.get(key) ?? { platform: key, leads: 0, consultations: 0, conversions: 0, revenueCents: 0 }
    item.consultations += 1
    byPlatform.set(key, item)
  }
  const rows = [...byPlatform.values()].sort((a, b) => b.leads - a.leads)
  const totalLeads = rows.reduce((sum, row) => sum + row.leads, 0)
  return {
    totalLeads,
    attributedLeads: rows.filter((row) => row.platform !== 'unattributed').reduce((sum, row) => sum + row.leads, 0),
    byPlatform: rows,
    funnel: {
      impressions: totals.impressions,
      clicks: totals.clicks,
      leads: totalLeads || totals.leads,
      consultations: rows.reduce((sum, row) => sum + row.consultations, 0),
      closedWon: rows.reduce((sum, row) => sum + row.conversions, 0),
    },
  }
}

export async function buildExecutiveWeeklyReport(input?: { weekStart?: Date; weekEnd?: Date; generatedBy?: 'system' | 'admin' }) {
  const fallback = getPreviousCompletedWeek()
  const weekStart = input?.weekStart ?? fallback.weekStart
  const weekEnd = input?.weekEnd ?? fallback.weekEnd
  const range = { start: weekStart, end: weekEnd }
  const [dashboard, performance, comments, topics, attribution] = await Promise.all([
    getExecutiveDashboard(range),
    getPostPerformance(range),
    getCommentIntelligence(range),
    getTrendingTopics(range),
    getLeadAttribution(range),
  ])

  const topPost = performance.topPosts[0]
  const topTopic = topics[0]
  const executiveSummary = `For ${weekStart.toLocaleDateString()} through ${weekEnd.toLocaleDateString()}, Latimore OS tracked ${dashboard.totals.engagement.toLocaleString()} engagements, ${dashboard.totals.clicks.toLocaleString()} clicks, and ${attribution.totalLeads.toLocaleString()} lead signals. ${topPost ? `The strongest post was on ${topPost.platform}.` : 'No standout post was detected yet.'} ${topTopic ? `The leading topic was ${topTopic.topic}.` : ''}`

  const kpis = { executiveSummary, totals: dashboard.totals, deltas: dashboard.deltas, sentiment: comments.sentiment, attribution: attribution.funnel }
  const insights = dashboard.topInsights.map((insight) => `${insight.title}: ${insight.summary}`)
  const opportunities = [
    topPost ? `Repurpose the top ${topPost.platform} post angle into a follow-up CTA.` : 'Publish at least one educational post tied to a consultation CTA.',
    topTopic ? `Build the next content theme around ${topTopic.topic}.` : 'Collect more comment and post data to identify a reliable topic signal.',
    attribution.totalLeads === 0 ? 'Add stronger UTM tracking and clearer booking links to social posts.' : 'Prioritize follow-up on attributed lead sources with booked-call activity.',
  ]
  const recommendations = {
    actions: ['Review high-intent comments manually.', 'Turn the strongest weekly topic into one education-first post.', 'Check unattributed leads and tighten UTM coverage.'],
    recommendedPosts: topics.slice(0, 3).map((topic) => ({ topic: topic.topic, angle: 'Education-first local insurance guidance', platform: 'facebook/linkedin' })),
    topPosts: performance.topPosts,
    weakPosts: performance.weakPosts,
    highIntentComments: comments.highIntent,
    complianceRiskComments: comments.complianceRisk,
  }

  const report = await prisma.weeklyReport.upsert({
    where: { weekStart_weekEnd: { weekStart, weekEnd } },
    create: { weekStart, weekEnd, kpis: kpis as Prisma.InputJsonValue, insights: insights as Prisma.InputJsonValue, opportunities: opportunities as Prisma.InputJsonValue, recommendations: recommendations as Prisma.InputJsonValue },
    update: { kpis: kpis as Prisma.InputJsonValue, insights: insights as Prisma.InputJsonValue, opportunities: opportunities as Prisma.InputJsonValue, recommendations: recommendations as Prisma.InputJsonValue },
  })

  await prisma.systemEvent.create({ data: { type: 'weekly_report_generated', source: 'latimore_os', payload: { reportId: report.id, generatedBy: input?.generatedBy ?? 'system' } as Prisma.InputJsonValue } }).catch(() => null)
  return { report, analysis: { executiveSummary, kpis, insights, opportunities, recommendations }, dashboard, performance, comments, topics, attribution }
}

export function reportToAnalysis(report: { kpis: unknown; insights: unknown; opportunities: unknown; recommendations: unknown }) {
  const kpis = (report.kpis ?? {}) as { executiveSummary?: string; totals?: Record<string, number> }
  const recommendations = (report.recommendations ?? {}) as { actions?: string[]; recommendedPosts?: Array<{ topic?: string; angle?: string }>; topPosts?: Array<{ caption?: string; platform?: string }>; weakPosts?: Array<{ caption?: string; platform?: string }>; complianceRiskComments?: unknown[] }
  return {
    summary: kpis.executiveSummary ?? 'Weekly executive report',
    kpi_highlights: Object.entries(kpis.totals ?? {}).slice(0, 8).map(([key, value]) => `${key}: ${value}`),
    top_performing: (recommendations.topPosts ?? []).slice(0, 5).map((post) => `${post.platform || 'social'}: ${post.caption || 'Post'}`),
    weakest_areas: (recommendations.weakPosts ?? []).slice(0, 5).map((post) => `${post.platform || 'social'}: ${post.caption || 'Post'}`),
    growth_opportunities: Array.isArray(report.opportunities) ? report.opportunities as string[] : [],
    risks: recommendations.complianceRiskComments?.length ? ['Review compliance-risk comments before responding.'] : ['No major compliance-risk trend detected.'],
    recommended_actions: recommendations.actions ?? [],
    recommended_posts: (recommendations.recommendedPosts ?? []).map((post) => `${post.topic || 'Topic'}: ${post.angle || 'Follow-up post'}`),
  }
}
