import { NextRequest, NextResponse } from 'next/server'
import { requireAdminSession, requireCronAuth } from '@/lib/ai/shared'

import { rateLimit } from '@/lib/rate-limit'
import { prisma } from '@/lib/prisma'
import { buildWeeklyReport } from '@/lib/reports/weekly-report'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, 'reports')
  if (limited) return limited

  // Accept cron secret OR admin session
  if (requireCronAuth(req) !== null) {
    const auth = await requireAdminSession()
    if (!auth.ok) return auth.response
  }

  const { report, analysis } = await buildWeeklyReport()
  return NextResponse.json({ ok: true, report, analysis })
}

export async function GET() {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  const reports = await prisma.weeklyReport.findMany({
    orderBy: { weekStart: 'desc' },
    take: 10,
  })

  return NextResponse.json({ ok: true, reports })
}
