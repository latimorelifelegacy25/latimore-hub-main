// app/api/reports/crm/route.ts
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { getCrmAnalytics } from '@/lib/reporting'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  const limited = await rateLimit(req, 'reports')
  if (limited) return limited

  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  try {
    const analytics = await getCrmAnalytics()
    return NextResponse.json({ ok: true, ...analytics })
  } catch (error) {
    logger.error(
      { err: error instanceof Error ? error.message : String(error) },
      '[reports] CRM analytics error'
    )

    return NextResponse.json({
      ok: false,
      pipeline: [],
      leadScores: [],
      tasks: { total: 0, completed: 0, open: 0, overdue: 0 },
      funnel: [],
      recentActivity: [],
      aiTasks: { generated: 0, completed: 0, pending: 0, overdue: 0, completionRate: 0 }
    })
  }
}
