import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { AnalyticsJobStatus, EventType, PipelineStage, LeadStatus } from '@prisma/client'
import type { Prisma } from '@prisma/client'
import { calculateDailyMetrics, type DateWindow } from './metrics'
import { normalizeCampaign } from '@/lib/hub/normalizers'

// ─── Helpers ────────────────────────────────────────────────────────────────

export function eachUtcDay(from: Date, to: Date): Date[] {
  const days: Date[] = []
  const cursor = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()),
  )
  const end = new Date(
    Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()),
  )
  while (cursor <= end) {
    days.push(new Date(cursor))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return days
}

export function dayBoundsUtc(day: Date): DateWindow {
  const from = new Date(
    Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), 0, 0, 0, 0),
  )
  const to = new Date(
    Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), 23, 59, 59, 999),
  )
  return { from, to }
}

// ─── Funnel types ────────────────────────────────────────────────────────────

export type CalculatedFunnelStage = {
  stageKey: string
  stageOrder: number
  count: number
  conversionRate: number
  dropOffRate: number
  avgHoursFromPrevStage: number | null
}

function avgHoursBetween(pairs: Array<{ from: Date; to: Date }>): number | null {
  if (pairs.length === 0) return null
  const totalHours = pairs.reduce((sum, p) => sum + (p.to.getTime() - p.from.getTime()) / 36e5, 0)
  return totalHours / pairs.length
}

const FUNNEL_STAGES = [
  { key: 'visitor', order: 1 },
  { key: 'engaged', order: 2 },
  { key: 'lead', order: 3 },
  { key: 'qualified', order: 4 },
  { key: 'booked', order: 5 },
  { key: 'sold', order: 6 },
] as const

// ─── Breakdown types ─────────────────────────────────────────────────────────

export type CalculatedBreakdown = {
  metricKey: string
  dimension: string
  dimensionValue: string
  value: number
  unit: string
}

const CTA_CLICK_TYPES: EventType[] = [
  EventType.cta_click,
  EventType.call_click,
  EventType.text_click,
  EventType.email_click,
  EventType.book_click,
]

const BREAKDOWN_DIMENSIONS = [
  'source',
  'medium',
  'campaign',
  'county',
  'productInterest',
  'stage',
  'status',
  'landingPage',
  'pageUrl',
  'eventType',
  'platform',
] as const

// ─── Funnel calculation ───────────────────────────────────────────────────────

export async function calculateDailyFunnel(
  window: DateWindow,
): Promise<CalculatedFunnelStage[]> {
  const { from, to } = window

  const [
    visitorCount,
    engagedCount,
    leadCount,
    qualifiedCount,
    bookedCount,
    soldCount,
  ] = await Promise.all([
    // visitor: unique sessions with page_view events
    prisma.leadSession.count({
      where: {
        events: {
          some: {
            occurredAt: { gte: from, lte: to },
            eventType: EventType.page_view,
          },
        },
      },
    }),

    // engaged: sessions with CTA click events
    prisma.leadSession.count({
      where: {
        events: {
          some: {
            occurredAt: { gte: from, lte: to },
            eventType: { in: CTA_CLICK_TYPES },
          },
        },
      },
    }),

    // lead: new Inquiries created
    prisma.inquiry.count({ where: { createdAt: { gte: from, lte: to } } }),

    // qualified: Inquiries that reached Qualified stage (by history or current)
    prisma.inquiry.count({
      where: {
        createdAt: { gte: from, lte: to },
        stage: {
          in: [
            PipelineStage.Qualified,
            PipelineStage.Booked,
            PipelineStage.Sold,
          ],
        },
      },
    }),

    // booked: non-cancelled appointments created in window
    prisma.appointment.count({
      where: {
        createdAt: { gte: from, lte: to },
        NOT: { status: 'Cancelled' },
      },
    }),

    // sold
    (async () => {
      const [soldInquiries, wonContacts] = await Promise.all([
        prisma.inquiry.count({
          where: { updatedAt: { gte: from, lte: to }, stage: PipelineStage.Sold },
        }),
        prisma.contact.count({
          where: { updatedAt: { gte: from, lte: to }, status: LeadStatus.CLOSED_WON },
        }),
      ])
      return Math.max(soldInquiries, wonContacts)
    })(),
  ])

  const counts = [visitorCount, engagedCount, leadCount, qualifiedCount, bookedCount, soldCount]
  const topCount = counts[0]

  // Each stage's "from" timestamp is the best available prior-stage marker for that
  // entity (session first-seen, or inquiry creation), used to flag abandonment points.
  const [engagedPairs, leadPairs, qualifiedPairs, bookedPairs, soldPairs] = await Promise.all([
    prisma.leadSession
      .findMany({
        where: { events: { some: { occurredAt: { gte: from, lte: to }, eventType: { in: CTA_CLICK_TYPES } } } },
        select: {
          firstSeenAt: true,
          events: {
            where: { eventType: { in: CTA_CLICK_TYPES }, occurredAt: { gte: from, lte: to } },
            orderBy: { occurredAt: 'asc' },
            take: 1,
            select: { occurredAt: true },
          },
        },
      })
      .then((rows) =>
        rows.filter((r) => r.events.length > 0).map((r) => ({ from: r.firstSeenAt, to: r.events[0].occurredAt })),
      ),

    prisma.inquiry
      .findMany({
        where: { createdAt: { gte: from, lte: to }, leadSessionId: { not: null } },
        select: { createdAt: true, leadSession: { select: { firstSeenAt: true } } },
      })
      .then((rows) =>
        rows
          .filter((r) => r.leadSession)
          .map((r) => ({ from: r.leadSession!.firstSeenAt, to: r.createdAt })),
      ),

    prisma.inquiryStageHistory
      .findMany({
        where: { toStage: PipelineStage.Qualified, changedAt: { gte: from, lte: to } },
        select: { changedAt: true, inquiry: { select: { createdAt: true } } },
      })
      .then((rows) => rows.map((r) => ({ from: r.inquiry.createdAt, to: r.changedAt }))),

    prisma.appointment
      .findMany({
        where: { createdAt: { gte: from, lte: to }, inquiryId: { not: null } },
        select: { createdAt: true, inquiry: { select: { createdAt: true } } },
      })
      .then((rows) =>
        rows.filter((r) => r.inquiry).map((r) => ({ from: r.inquiry!.createdAt, to: r.createdAt })),
      ),

    prisma.inquiryStageHistory
      .findMany({
        where: { toStage: PipelineStage.Sold, changedAt: { gte: from, lte: to } },
        select: { changedAt: true, inquiry: { select: { createdAt: true } } },
      })
      .then((rows) => rows.map((r) => ({ from: r.inquiry.createdAt, to: r.changedAt }))),
  ])

  const avgHours: Array<number | null> = [
    null,
    avgHoursBetween(engagedPairs),
    avgHoursBetween(leadPairs),
    avgHoursBetween(qualifiedPairs),
    avgHoursBetween(bookedPairs),
    avgHoursBetween(soldPairs),
  ]

  return FUNNEL_STAGES.map((stage, i) => ({
    stageKey: stage.key,
    stageOrder: stage.order,
    count: counts[i],
    conversionRate: topCount > 0 ? (counts[i] / topCount) * 100 : 0,
    dropOffRate: i === 0 || counts[i - 1] === 0 ? 0 : Math.max(0, 100 - (counts[i] / counts[i - 1]) * 100),
    avgHoursFromPrevStage: avgHours[i],
  }))
}

// ─── Breakdown calculation ────────────────────────────────────────────────────

export async function calculateDailyBreakdowns(
  window: DateWindow,
): Promise<CalculatedBreakdown[]> {
  const { from, to } = window
  const results: CalculatedBreakdown[] = []

  const [
    leadsBySource,
    leadsByCounty,
    leadsByProduct,
    leadsByStage,
    leadsByCampaign,
    leadsByMedium,
    clicksByType,
    clicksBySource,
    socialByPlatform,
  ] = await Promise.all([
    prisma.inquiry.groupBy({
      by: ['source'],
      where: { createdAt: { gte: from, lte: to } },
      _count: { _all: true },
    }),
    prisma.inquiry.groupBy({
      by: ['county'],
      where: { createdAt: { gte: from, lte: to } },
      _count: { _all: true },
    }),
    prisma.inquiry.groupBy({
      by: ['productInterest'],
      where: { createdAt: { gte: from, lte: to } },
      _count: { _all: true },
    }),
    prisma.inquiry.groupBy({
      by: ['stage'],
      where: { createdAt: { gte: from, lte: to } },
      _count: { _all: true },
    }),
    prisma.inquiry.groupBy({
      by: ['campaign'],
      where: { createdAt: { gte: from, lte: to } },
      _count: { _all: true },
    }),
    prisma.inquiry.groupBy({
      by: ['medium'],
      where: { createdAt: { gte: from, lte: to } },
      _count: { _all: true },
    }),
    prisma.event.groupBy({
      by: ['eventType'],
      where: { occurredAt: { gte: from, lte: to }, eventType: { in: CTA_CLICK_TYPES } },
      _count: { _all: true },
    }),
    prisma.event.groupBy({
      by: ['source'],
      where: { occurredAt: { gte: from, lte: to }, eventType: { in: CTA_CLICK_TYPES } },
      _count: { _all: true },
    }),
    prisma.socialMetric.groupBy({
      by: ['platform'],
      where: { metricDate: { gte: from, lte: to } },
      _sum: { clicks: true, reactions: true, comments: true, shares: true, saves: true },
    }),
  ])

  // Lead count by source
  for (const row of leadsBySource) {
    if (!row.source) continue
    results.push({
      metricKey: 'lead_count',
      dimension: 'source',
      dimensionValue: row.source,
      value: row._count._all,
      unit: 'count',
    })
  }

  // Lead count by county
  for (const row of leadsByCounty) {
    if (!row.county) continue
    results.push({
      metricKey: 'lead_count',
      dimension: 'county',
      dimensionValue: row.county,
      value: row._count._all,
      unit: 'count',
    })
  }

  // Lead count by productInterest
  for (const row of leadsByProduct) {
    if (!row.productInterest) continue
    results.push({
      metricKey: 'lead_count',
      dimension: 'productInterest',
      dimensionValue: String(row.productInterest),
      value: row._count._all,
      unit: 'count',
    })
  }

  // Lead count by stage
  for (const row of leadsByStage) {
    if (!row.stage) continue
    results.push({
      metricKey: 'lead_count',
      dimension: 'stage',
      dimensionValue: String(row.stage),
      value: row._count._all,
      unit: 'count',
    })
  }

  // Lead count by campaign (collapsed to canonical buckets via normalizeCampaign)
  const campaignCounts = new Map<string, number>()
  for (const row of leadsByCampaign) {
    if (!row.campaign) continue
    const canonical = normalizeCampaign(row.campaign)
    campaignCounts.set(canonical, (campaignCounts.get(canonical) ?? 0) + row._count._all)
  }
  for (const [campaign, value] of campaignCounts) {
    results.push({
      metricKey: 'lead_count',
      dimension: 'campaign',
      dimensionValue: campaign,
      value,
      unit: 'count',
    })
  }

  // Lead count by medium
  for (const row of leadsByMedium) {
    if (!row.medium) continue
    results.push({
      metricKey: 'lead_count',
      dimension: 'medium',
      dimensionValue: row.medium,
      value: row._count._all,
      unit: 'count',
    })
  }

  // CTA clicks by eventType
  for (const row of clicksByType) {
    results.push({
      metricKey: 'cta_click_count',
      dimension: 'eventType',
      dimensionValue: row.eventType,
      value: row._count._all,
      unit: 'count',
    })
  }

  // CTA clicks by source
  for (const row of clicksBySource) {
    if (!row.source) continue
    results.push({
      metricKey: 'cta_click_count',
      dimension: 'source',
      dimensionValue: row.source,
      value: row._count._all,
      unit: 'count',
    })
  }

  // Social engagement by platform
  for (const row of socialByPlatform) {
    const engagement =
      (row._sum.clicks ?? 0) +
      (row._sum.reactions ?? 0) +
      (row._sum.comments ?? 0) +
      (row._sum.shares ?? 0) +
      (row._sum.saves ?? 0)
    results.push({
      metricKey: 'social_engagement_count',
      dimension: 'platform',
      dimensionValue: row.platform,
      value: engagement,
      unit: 'count',
    })
  }

  return results
}

// ─── Upsert helpers ───────────────────────────────────────────────────────────

async function upsertMetrics(
  metrics: Awaited<ReturnType<typeof calculateDailyMetrics>>,
): Promise<number> {
  const ops = metrics.map((m) => {
    const { metricDate, metricKey, value, unit, metadata } = m
    return prisma.analyticsDailyMetric.upsert({
      where: { metricDate_metricKey: { metricDate, metricKey } },
      create: {
        metricDate,
        metricKey,
        value,
        unit: unit ?? 'count',
        ...(metadata != null ? { metadata: metadata as Prisma.InputJsonValue } : {}),
      },
      update: {
        value,
        unit: unit ?? 'count',
        ...(metadata != null ? { metadata: metadata as Prisma.InputJsonValue } : {}),
      },
    })
  })
  if (ops.length > 0) await prisma.$transaction(ops)
  return ops.length
}

async function upsertFunnel(
  metricDate: Date,
  stages: CalculatedFunnelStage[],
): Promise<void> {
  const ops = stages.map((s) => {
    const { stageKey, stageOrder, count, conversionRate, dropOffRate, avgHoursFromPrevStage } = s
    const metadata = { dropOffRate, avgHoursFromPrevStage } as Prisma.InputJsonValue
    return prisma.analyticsFunnelDaily.upsert({
      where: { metricDate_funnelKey_stageKey: { metricDate, funnelKey: 'lead_funnel', stageKey } },
      create: { metricDate, funnelKey: 'lead_funnel', stageKey, stageOrder, count, conversionRate, metadata },
      update: { count, conversionRate, metadata },
    })
  })
  if (ops.length > 0) await prisma.$transaction(ops)
}

async function upsertBreakdowns(
  metricDate: Date,
  breakdowns: CalculatedBreakdown[],
): Promise<void> {
  const ops = breakdowns.map((b) => {
    const { metricKey, dimension, dimensionValue, value } = b
    return prisma.analyticsBreakdownDaily.upsert({
      where: {
        metricDate_metricKey_dimension_dimensionValue: {
          metricDate,
          metricKey,
          dimension,
          dimensionValue,
        },
      },
      create: { metricDate, metricKey, dimension, dimensionValue, value, unit: 'count' },
      update: { value },
    })
  })
  if (ops.length > 0) await prisma.$transaction(ops)
}

// ─── Main rebuild functions ───────────────────────────────────────────────────

export async function rebuildAnalyticsRange(input: { from: Date; to: Date }): Promise<void> {
  const jobRun = await prisma.analyticsJobRun.create({
    data: {
      jobKey: 'rebuild_analytics_range',
      status: AnalyticsJobStatus.running,
      targetStart: input.from,
      targetEnd: input.to,
    },
  })

  let rowsProcessed = 0
  let error: string | undefined

  try {
    const days = eachUtcDay(input.from, input.to)
    logger.info({ jobRunId: jobRun.id, days: days.length }, 'Starting analytics rebuild')

    for (const day of days) {
      const window = dayBoundsUtc(day)

      const [metrics, funnel, breakdowns] = await Promise.all([
        calculateDailyMetrics(window),
        calculateDailyFunnel(window),
        calculateDailyBreakdowns(window),
      ])

      const [metricsCount] = await Promise.all([
        upsertMetrics(metrics),
        upsertFunnel(day, funnel),
        upsertBreakdowns(day, breakdowns),
      ])

      rowsProcessed += metricsCount + funnel.length + breakdowns.length
    }

    await prisma.analyticsJobRun.update({
      where: { id: jobRun.id },
      data: {
        status: AnalyticsJobStatus.succeeded,
        finishedAt: new Date(),
        rowsProcessed,
      },
    })

    logger.info({ jobRunId: jobRun.id, rowsProcessed }, 'Analytics rebuild complete')
  } catch (err) {
    error = err instanceof Error ? err.message : String(err)
    logger.error({ jobRunId: jobRun.id, error }, 'Analytics rebuild failed')
    await prisma.analyticsJobRun.update({
      where: { id: jobRun.id },
      data: {
        status: AnalyticsJobStatus.failed,
        finishedAt: new Date(),
        rowsProcessed,
        error,
      },
    })
    throw err
  }
}

export async function rebuildTrailingAnalytics(days = 7): Promise<void> {
  const to = new Date()
  const from = new Date(to)
  from.setUTCDate(from.getUTCDate() - (days - 1))
  from.setUTCHours(0, 0, 0, 0)
  to.setUTCHours(23, 59, 59, 999)
  await rebuildAnalyticsRange({ from, to })
}
