export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/ai/shared'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { analyticsFilterSchema, parseAnalyticsDateRange } from '@/lib/analytics/contracts'
import { logger } from '@/lib/logger'

function pct(current: number, base: number) {
  return base > 0 ? (current / base) * 100 : 0
}

function eventMetadata(metadata: unknown): Record<string, unknown> {
  return metadata && typeof metadata === 'object' ? (metadata as Record<string, unknown>) : {}
}

function eventDescription(event: {
  eventType: string
  pageUrl: string | null
  metadata: unknown
}) {
  const metadata = eventMetadata(event.metadata)
  const label = typeof metadata.label === 'string' ? metadata.label : null
  const title = typeof metadata.title === 'string' ? metadata.title : null
  const semantic = typeof metadata.latimoreEvent === 'string' ? metadata.latimoreEvent : null
  const tool = typeof metadata.tool === 'string' ? metadata.tool : null
  if (semantic) return `${semantic}${tool ? ` — ${tool}` : ''}${label ? ` — ${label}` : ''}`
  if (label) return `${event.eventType} — ${label}`
  if (title) return `${event.eventType} — ${title}`
  return `${event.eventType}${event.pageUrl ? ` — ${event.pageUrl}` : ''}`
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  const limited = await rateLimit(req, 'analytics')
  if (limited) return limited

  const params = Object.fromEntries(req.nextUrl.searchParams.entries())
  const parsed = analyticsFilterSchema.safeParse(params)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid params' }, { status: 400 })
  }

  try {
    const { from, to } = parseAnalyticsDateRange(parsed.data)

    const CTA_TYPES = ['cta_click', 'call_click', 'text_click', 'email_click', 'book_click', 'book_consultation_clicked', 'instant_quote_clicked', 'service_card_clicked']

    const [
      typeCountRows,
      sessionTotalRows,
      dailyTypeRows,
      dailySessionRows,
      sourceRows,
      toolRows,
      leadCount,
      contactCount,
      appointmentBookedCount,
      soldInquiryCount,
      soldContactCount,
      scoreAgg,
      staleLeads,
      overdueTasks,
      recentEventsRaw,
      opportunitiesRaw,
    ] = await Promise.all([
      prisma.$queryRaw<Array<{ type: string; count: number }>>`
        SELECT "eventType"::text AS type, COUNT(*)::int AS count
        FROM "Event"
        WHERE "occurredAt" >= ${from} AND "occurredAt" <= ${to}
        GROUP BY 1
      `,
      prisma.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(DISTINCT "leadSessionId")::int AS count
        FROM "Event"
        WHERE "occurredAt" >= ${from} AND "occurredAt" <= ${to}
      `,
      prisma.$queryRaw<Array<{ date: string; type: string; count: number }>>`
        SELECT to_char("occurredAt", 'YYYY-MM-DD') AS date, "eventType"::text AS type, COUNT(*)::int AS count
        FROM "Event"
        WHERE "occurredAt" >= ${from} AND "occurredAt" <= ${to}
        GROUP BY 1, 2
      `,
      prisma.$queryRaw<Array<{ date: string; count: number }>>`
        SELECT to_char("occurredAt", 'YYYY-MM-DD') AS date, COUNT(DISTINCT "leadSessionId")::int AS count
        FROM "Event"
        WHERE "occurredAt" >= ${from} AND "occurredAt" <= ${to}
        GROUP BY 1
      `,
      prisma.$queryRaw<Array<{ source: string; count: number }>>`
        SELECT COALESCE(NULLIF("source", ''), '(direct / unknown)') AS source, COUNT(*)::int AS count
        FROM "Event"
        WHERE "occurredAt" >= ${from} AND "occurredAt" <= ${to} AND "eventType" = 'page_view'
        GROUP BY 1
        ORDER BY 2 DESC, 1 ASC
        LIMIT 20
      `,
      prisma.$queryRaw<Array<{
        tool: string
        category: string | null
        events: number
        sessions: number
        opens: number
        starts: number
        completions: number
        cta_clicks: number
        lead_submissions: number
        booking_clicks: number
        booking_sessions: number
        start_sessions: number
        started_and_completed: number
      }>>`
        WITH ev AS (
          SELECT
            "metadata"->>'tool' AS tool,
            CASE WHEN jsonb_typeof("metadata"->'category') = 'string' THEN "metadata"->>'category' END AS category,
            CASE WHEN jsonb_typeof("metadata"->'latimoreEvent') = 'string' THEN "metadata"->>'latimoreEvent' END AS semantic,
            "leadSessionId" AS sid,
            "occurredAt"
          FROM "Event"
          WHERE "occurredAt" >= ${from} AND "occurredAt" <= ${to}
            AND jsonb_typeof("metadata"->'tool') = 'string'
            AND "metadata"->>'tool' <> ''
        ),
        sess AS (
          SELECT tool,
            COUNT(*) FILTER (WHERE st) AS start_sessions,
            COUNT(*) FILTER (WHERE st AND co) AS started_and_completed
          FROM (
            SELECT tool, sid,
              bool_or(semantic = 'tool_started') AS st,
              bool_or(semantic = 'tool_completed') AS co
            FROM ev
            WHERE sid IS NOT NULL
            GROUP BY tool, sid
          ) per_session
          GROUP BY tool
        )
        SELECT
          ev.tool AS tool,
          COALESCE(
            (array_agg(ev.category ORDER BY ev."occurredAt") FILTER (WHERE ev.category IS NOT NULL AND ev.category <> ''))[1],
            (array_agg(ev.category ORDER BY ev."occurredAt"))[1]
          ) AS category,
          COUNT(*)::int AS events,
          COUNT(DISTINCT ev.sid)::int AS sessions,
          (COUNT(*) FILTER (WHERE ev.semantic = 'tool_opened'))::int AS opens,
          (COUNT(*) FILTER (WHERE ev.semantic = 'tool_started'))::int AS starts,
          (COUNT(*) FILTER (WHERE ev.semantic = 'tool_completed'))::int AS completions,
          (COUNT(*) FILTER (WHERE ev.semantic IN ('tool_cta_clicked', 'referral_clicked')))::int AS cta_clicks,
          (COUNT(*) FILTER (WHERE ev.semantic = 'lead_submitted'))::int AS lead_submissions,
          (COUNT(*) FILTER (WHERE ev.semantic = 'booking_clicked'))::int AS booking_clicks,
          (COUNT(DISTINCT ev.sid) FILTER (WHERE ev.semantic = 'booking_clicked'))::int AS booking_sessions,
          COALESCE(MAX(sess.start_sessions), 0)::int AS start_sessions,
          COALESCE(MAX(sess.started_and_completed), 0)::int AS started_and_completed
        FROM ev
        LEFT JOIN sess ON sess.tool = ev.tool
        GROUP BY ev.tool
        ORDER BY events DESC, MIN(ev."occurredAt") ASC
      `,
      prisma.inquiry.count({ where: { createdAt: { gte: from, lte: to } } }),
      prisma.contact.count({ where: { createdAt: { gte: from, lte: to } } }),
      prisma.appointment.count({ where: { createdAt: { gte: from, lte: to }, NOT: { status: 'Cancelled' } } }),
      prisma.inquiry.count({ where: { updatedAt: { gte: from, lte: to }, stage: 'Sold' } }),
      prisma.contact.count({ where: { updatedAt: { gte: from, lte: to }, status: 'CLOSED_WON' } }),
      prisma.inquiry.aggregate({ where: { createdAt: { gte: from, lte: to } }, _avg: { leadScore: true } }),
      prisma.inquiry.count({ where: { stage: { notIn: ['Sold', 'Lost'] }, updatedAt: { lt: new Date(Date.now() - 7 * 86_400_000) } } }),
      prisma.task.count({ where: { status: { not: 'Completed' }, dueAt: { lt: new Date() } } }),
      prisma.event.findMany({
        where: { occurredAt: { gte: from, lte: to } },
        select: { id: true, eventType: true, source: true, medium: true, campaign: true, occurredAt: true, pageUrl: true, metadata: true },
        orderBy: { occurredAt: 'desc' },
        take: 30,
      }),
      prisma.inquiry.findMany({
        where: { stage: { notIn: ['Sold', 'Lost'] } },
        include: { contact: { select: { fullName: true, firstName: true, lastName: true, lastActivityAt: true } } },
        orderBy: [{ leadScore: 'desc' }, { updatedAt: 'desc' }],
        take: 25,
      }),
    ])

    const typeTotals = new Map(typeCountRows.map(row => [row.type, Number(row.count)]))
    const countType = (types: string[]) => types.reduce((sum, type) => sum + (typeTotals.get(type) ?? 0), 0)
    const pageViewCount = countType(['page_view'])
    const sessionCount = Number(sessionTotalRows[0]?.count ?? 0)
    const ctaClickCount = countType(CTA_TYPES)
    const bookingClickCount = countType(['book_click', 'book_consultation_clicked'])
    const formSubmitCount = countType(['form_submit', 'lead_submitted'])
    const toolStartCount = countType(['legacy_checkup_started'])
    const toolCompleteCount = countType(['legacy_checkup_completed'])
    const soldCount = Math.max(soldInquiryCount, soldContactCount)

    const dayMap = new Map<string, { date: string; page_view_count: number; session_count: number; cta_click_count: number; tool_start_count: number; tool_complete_count: number; appointment_booked_count: number }>()
    const dayRow = (date: string) => {
      let row = dayMap.get(date)
      if (!row) {
        row = { date, page_view_count: 0, session_count: 0, cta_click_count: 0, tool_start_count: 0, tool_complete_count: 0, appointment_booked_count: 0 }
        dayMap.set(date, row)
      }
      return row
    }
    for (const { date, type, count } of dailyTypeRows) {
      const row = dayRow(date)
      const n = Number(count)
      if (type === 'page_view') row.page_view_count += n
      if (CTA_TYPES.includes(type)) row.cta_click_count += n
      if (type === 'legacy_checkup_started') row.tool_start_count += n
      if (type === 'legacy_checkup_completed') row.tool_complete_count += n
      if (type === 'appointment_booked') row.appointment_booked_count += n
    }
    for (const { date, count } of dailySessionRows) dayRow(date).session_count = Number(count)

    const timeSeries = Array.from(dayMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(row => ({
        date: row.date,
        page_view_count: row.page_view_count,
        session_count: row.session_count,
        cta_click_count: row.cta_click_count,
        tool_start_count: row.tool_start_count,
        tool_complete_count: row.tool_complete_count,
        appointment_booked_count: row.appointment_booked_count,
      }))

    const breakdowns = sourceRows
      .map(row => ({ dimension: 'source', dimensionValue: row.source, value: Number(row.count), unit: 'page_views', metricKey: 'page_view_count' }))

    const toolPerformance = toolRows.map(row => ({
      tool: row.tool,
      category: row.category,
      events: Number(row.events),
      sessions: Number(row.sessions),
      opens: Number(row.opens),
      starts: Number(row.starts),
      completions: Number(row.completions),
      ctaClicks: Number(row.cta_clicks),
      leadSubmissions: Number(row.lead_submissions),
      bookingClicks: Number(row.booking_clicks),
      bookingSessions: Number(row.booking_sessions),
      completionRate: Number(row.start_sessions) > 0
        ? (Number(row.started_and_completed) / Number(row.start_sessions)) * 100
        : 0,
    }))

    const funnel = [
      { stageKey: 'sessions', stageOrder: 1, count: sessionCount, conversionRate: 100, dropOffRate: 0, avgHoursFromPrevStage: null },
      { stageKey: 'cta_clicks', stageOrder: 2, count: ctaClickCount, conversionRate: pct(ctaClickCount, sessionCount), dropOffRate: Math.max(0, 100 - pct(ctaClickCount, sessionCount)), avgHoursFromPrevStage: null },
      { stageKey: 'leads', stageOrder: 3, count: leadCount, conversionRate: pct(leadCount, sessionCount), dropOffRate: ctaClickCount > 0 ? Math.max(0, 100 - pct(leadCount, ctaClickCount)) : 0, avgHoursFromPrevStage: null },
      { stageKey: 'booked', stageOrder: 4, count: appointmentBookedCount, conversionRate: pct(appointmentBookedCount, sessionCount), dropOffRate: leadCount > 0 ? Math.max(0, 100 - pct(appointmentBookedCount, leadCount)) : 0, avgHoursFromPrevStage: null },
      { stageKey: 'sold', stageOrder: 5, count: soldCount, conversionRate: pct(soldCount, sessionCount), dropOffRate: appointmentBookedCount > 0 ? Math.max(0, 100 - pct(soldCount, appointmentBookedCount)) : 0, avgHoursFromPrevStage: null },
    ]

    const recentEvents = recentEventsRaw.map(event => ({
      id: event.id,
      type: String(event.eventType),
      source: event.source,
      medium: event.medium,
      campaign: event.campaign,
      occurredAt: event.occurredAt.toISOString(),
      description: eventDescription(event),
    }))

    const opportunities = opportunitiesRaw.map(inquiry => ({
      id: inquiry.id,
      contactName: inquiry.contact.fullName || [inquiry.contact.firstName, inquiry.contact.lastName].filter(Boolean).join(' ') || null,
      county: inquiry.county,
      productInterest: String(inquiry.productInterest),
      stage: String(inquiry.stage),
      leadScore: inquiry.leadScore,
      lastActivityAt: inquiry.contact.lastActivityAt?.toISOString() ?? inquiry.updatedAt.toISOString(),
      reason: inquiry.leadScore >= 70 ? 'High lead score' : inquiry.stage === 'Follow_Up' ? 'Follow-up required' : 'Active opportunity',
    }))

    return NextResponse.json({
      ok: true,
      range: { from: from.toISOString(), to: to.toISOString() },
      data: {
        overview: {
          pageViewCount,
          sessionCount,
          leadCount,
          contactCount,
          appointmentBookedCount,
          soldCount,
          ctaClickCount,
          bookingClickCount,
          formSubmitCount,
          toolStartCount,
          toolCompleteCount,
          leadToBookingRate: leadCount > 0 ? appointmentBookedCount / leadCount : 0,
          leadToSoldRate: leadCount > 0 ? soldCount / leadCount : 0,
          avgLeadScore: Number(scoreAgg._avg.leadScore ?? 0),
          staleLeadCount: staleLeads,
          taskOverdueCount: overdueTasks,
          socialClickCount: 0,
          socialEngagementCount: 0,
          aiSuccessRate: 0,
          aiAvgLatencyMs: 0,
          delta: { leadCount: null, contactCount: null, appointmentBookedCount: null, soldCount: null, ctaClickCount: null },
        },
        funnel,
        timeSeries,
        breakdowns,
        toolPerformance,
        recentEvents,
        opportunities,
        ai: { totalRuns: 0, successCount: 0, failedCount: 0, successRate: 0, avgLatencyMs: 0, byType: [], recentRuns: [] },
      },
      meta: {
        generatedAt: new Date().toISOString(),
        source: 'operational_live',
        warnings: [],
      },
    })
  } catch (err) {
    logger.error({ err }, 'analytics/v1/live error')
    return NextResponse.json({ ok: false, error: 'Failed to load live analytics.' }, { status: 500 })
  }
}
