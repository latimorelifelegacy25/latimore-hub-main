import { prisma } from '@/lib/prisma'

export const REQUIRED_OVERVIEW_METRIC_KEYS = [
  'lead_count',
  'contact_count',
  'appointment_booked_count',
  'sold_count',
  'cta_click_count',
  'form_submit_count',
  'lead_to_booking_rate',
  'lead_to_sold_rate',
  'avg_lead_score',
  'social_click_count',
  'social_engagement_count',
  'ai_success_rate',
  'ai_avg_latency_ms',
] as const

function startOfUtcDay(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate(), 0, 0, 0, 0))
}

function endOfUtcDay(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate(), 23, 59, 59, 999))
}

function eachUtcDay(from: Date, to: Date) {
  const days: Date[] = []
  const cursor = startOfUtcDay(from)
  const end = startOfUtcDay(to)

  while (cursor <= end) {
    days.push(new Date(cursor))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return days
}

function dayKey(value: Date) {
  return value.toISOString().slice(0, 10)
}

export async function assertAnalyticsOverviewCoverage(input: { from: Date; to: Date }) {
  const from = startOfUtcDay(input.from)
  const to = endOfUtcDay(input.to)
  const days = eachUtcDay(from, to)

  const rows = await prisma.analyticsDailyMetric.findMany({
    where: {
      metricDate: { gte: from, lte: to },
      metricKey: { in: [...REQUIRED_OVERVIEW_METRIC_KEYS] },
    },
    select: { metricDate: true, metricKey: true },
  })

  const present = new Set(rows.map((row) => `${dayKey(row.metricDate)}:${row.metricKey}`))
  const missing: string[] = []

  for (const day of days) {
    const date = dayKey(day)
    for (const metricKey of REQUIRED_OVERVIEW_METRIC_KEYS) {
      const key = `${date}:${metricKey}`
      if (!present.has(key)) missing.push(key)
    }
  }

  const expectedRows = days.length * REQUIRED_OVERVIEW_METRIC_KEYS.length

  if (missing.length > 0) {
    const sample = missing.slice(0, 10).join(', ')
    throw new Error(
      `Analytics mart coverage incomplete: ${rows.length}/${expectedRows} required rows present; missing ${missing.length}. Sample: ${sample}`,
    )
  }

  return {
    from,
    to,
    days: days.length,
    expectedRows,
    actualRows: rows.length,
  }
}
