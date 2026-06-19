import { NextRequest, NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/ai/shared'
import { rateLimit } from '@/lib/rate-limit'
import { buildExecutiveWeeklyReport } from '@/lib/engagement/executive'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, 'reports')
  if (limited) return limited

  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  const result = await buildExecutiveWeeklyReport({ generatedBy: 'admin' })
  return NextResponse.json({ ok: true, report: result.report, analysis: result.analysis })
}
