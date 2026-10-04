export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/ai/shared'
import { rateLimit } from '@/lib/rate-limit'
import { getDashboardOverview } from '@/lib/hub/reporting'

export async function GET(req: NextRequest) {
  const limited = await rateLimit(req, 'reports')
  if (limited) return limited

  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  const data = await getDashboardOverview()
  return NextResponse.json(data)
}
