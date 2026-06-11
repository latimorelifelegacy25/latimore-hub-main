import { NextRequest, NextResponse } from 'next/server'
import { requireCronAuth } from '@/lib/ai/shared'
import { buildExecutiveWeeklyReport, getPreviousCompletedWeek } from '@/lib/engagement/executive'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const unauthorized = requireCronAuth(req)
  if (unauthorized) return unauthorized

  const { weekStart, weekEnd } = getPreviousCompletedWeek()
  const existing = await prisma.weeklyReport.findUnique({ where: { weekStart_weekEnd: { weekStart, weekEnd } } })
  if (existing) {
    return NextResponse.json({ ok: true, processed: 1, generated: 0, skipped: 1, failed: 0, reportId: existing.id })
  }

  try {
    const result = await buildExecutiveWeeklyReport({ weekStart, weekEnd, generatedBy: 'system' })
    return NextResponse.json({ ok: true, processed: 1, generated: 1, skipped: 0, failed: 0, reportId: result.report.id })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await prisma.systemEvent.create({ data: { type: 'weekly_report_failed', source: 'cron', payload: { weekStart, weekEnd, error: message } } }).catch(() => null)
    return NextResponse.json({ ok: false, processed: 1, generated: 0, skipped: 0, failed: 1, error: message }, { status: 500 })
  }
}
