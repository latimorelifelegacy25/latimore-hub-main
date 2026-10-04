export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/ai/shared'
import { rateLimit } from '@/lib/rate-limit'
import { getSourceReport } from '@/lib/hub/reporting'
import { countAll } from '@/lib/prisma-helpers'

export async function GET(req: NextRequest) {
  const limited = await rateLimit(req, 'reports')
  if (limited) return limited
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  const items = await getSourceReport()
  return NextResponse.json({
    items: items.map((row) => ({
      source: row.source,
      medium: row.medium,
      campaign: row.campaign,
      count: countAll(row._count),
    })),
  })
}
