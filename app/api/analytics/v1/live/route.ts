export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { analyticsFilterSchema, parseAnalyticsDateRange } from '@/lib/analytics/contracts'
import { logger } from '@/lib/logger'

function pct(current: number, base: number) {
  return base > 0 ? (current / base) * 100 : 0
}

function eventDescription(event: {
  eventType: string
  pageUrl: string | null
  metadata: unknown
}) {
  const metadata = event.metadata && typeof event.metadata === 'object' ? (event.metadata as Record<string, unknown>) : {}
  const label = typeof metadata.label === 'string' ? metadata.label : null
  const title = typeof metadata.title === 'string' ? metadata.title : null
  const semantic = typeof metadata.latimoreEvent === 'string' ? metadata.latimoreEvent : null
  if (semantic) return `${semantic}${label ? ` — ${label}` : ''}`
  if (label) return `${event.eventType} — ${label}`
  if (title) return `${event.eventType} — ${title}`
  return `${event.eventType}${event.pageUrl ? ` — ${event.pageUrl}` : ''}`
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

  try {
    const { from, to } = parseAnalyticsDateRange(parsed.data)

    const [
      events,
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
      prisma.event.findMany({
        where: { occurredAt: { gte: from, lte: to } },
        select: {
          id: true,
          eventType: true,
          pageUrl: true,
          source: true,
          medium: true,
          campaign: true,
          leadSessionId: true,
          occurredAt: true,
          metadata: true,
        },
        orderBy: { occurredAt: 'asc' },
      }),
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

    const countType = (types: string[]) => events.filter(event => types.includes(String(event.eventType))).length
    const pageViewCount = countType(['page_view'])
    const sessionCount = new Set(events.map(event => event.leadSessionId).filter(Boolean)).size
    const ctaClickCount = countType(['cta_click', 'call_click', 'text_click', 'email_click', 'book_click', 'book_consultation_clicked', 'instant_quote_clicked', 'service_card_clicked'])
    const bookingClickCount = countType(['book_click', 'book_consultation_clicked'])
    const formSubmitCount = countType(['form_submit', 'lead_submitted'])
    const toolStartCount = countType(['legacy_checkup_started'])
    const toolCompleteCount = countType(['legacy_checkup_completed'])
    const soldCount = Math.max(soldInquiryCount, soldContactCount)

    const dayMap = new Map<string, { date: string; page_view_count: number; session_ids: Set<string>; cta_click_count: number; tool_start_count: number; tool_complete_count: number; appointment_booked_count: number }>()
    for (const event of events) {
      const date = event.occurredAt.toISOString().slice(0, 10)
      const row = dayMap.get(date) ?? {
        date,
        page_view_count: 0,
        session_ids: new Set<string>(),
        cta_click_count: 0,
        tool_start_count: 0,
        tool_complete_count: 0,
        appointment_booked_count: 0,
      }
      const type = String(event.eventType)
      if (type === 'page_view') row.page_view_count += 1
      if (event.leadSessionId) row.session_ids.add(event.leadSessionId)
      if (['cta_click', 'call_click', 'text_click', 'email_click', 'book_click', 'book_consultation_clicked', 'instant_quote_clicked', 'service_card_clicked'].includes(type)) row.cta_click_count += 1
      if (type === 'legacy_checkup_started') row.tool_start_count += 1
      if (type === 'legacy_checkup_completed') row.tool_complete_count += 1
      if (type === 'appointment_booked') row.appointment_booked_count += 1
      dayMap.set(date, row)
    }

    const timeSeries = Array.from(dayMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(row => ({
        date: row.date,
        page_view_count: row.page_view_count,
        session_count: row.session_ids.size,
        cta_click_count: row.cta_click_count,
        tool_start_count: row.tool_start_count,
        tool_complete_count: row.tool_complete_count,
        appointment_booked_count: row.appointment_booked_count,
      }))

    const sourceCounts = new Map<string, number>()
    for (const event of events) {
      if (String(event.eventType) !== 'page_view') continue
      const key = event.source || '(direct / unknown)'
      sourceCounts.set(key, (sourceCounts.get(key) ?? 0) + 1)
    }
    const breakdowns = Array.from(sourceCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([dimensionValue, value]) => ({ dimension: 'source', dimensionValue, value, unit: 'page_views', metricKey: 'page_view_count' }))

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
