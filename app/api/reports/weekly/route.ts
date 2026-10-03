import { NextRequest, NextResponse } from 'next/server'
import { requireCronAuth } from '@/lib/ai/shared'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { prisma } from '@/lib/prisma'
import { buildWeeklyReport } from '@/lib/reports/weekly-report'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, 'reports')
  if (limited) return limited

  const isCron = requireCronAuth(req) === null
  const session = await getServerSession(authOptions)
  if (!isCron && !session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { report, analysis } = await buildWeeklyReport()
  return NextResponse.json({ ok: true, report, analysis })
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const reports = await prisma.weeklyReport.findMany({
    orderBy: { weekStart: 'desc' },
    take: 10,
  })

  return NextResponse.json({ ok: true, reports })
}
