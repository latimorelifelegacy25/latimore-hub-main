import { NextRequest, NextResponse } from 'next/server'
import { buildWeeklyReport } from '@/lib/reports/weekly-report'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/cron/weekly-report
 * Scheduled every Monday at 07:00 ET via vercel.json cron.
 * Also accepts x-cron-secret header for manual triggers.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const header = req.headers.get('x-cron-secret') ?? req.headers.get('authorization')?.replace('Bearer ', '')

  if (!secret || header !== secret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const { report, analysis } = await buildWeeklyReport()

    await prisma.systemEvent.create({
      data: {
        type: 'cron.weekly_report.completed',
        payload: {
          reportId:  report.id,
          weekStart: report.weekStart,
          weekEnd:   report.weekEnd,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      message: 'Weekly report generated',
      reportId: report.id,
      weekStart: report.weekStart,
      weekEnd:   report.weekEnd,
      analysis,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[cron/weekly-report]', msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
