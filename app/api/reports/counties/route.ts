export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/ai/shared'
import { rateLimit } from '@/lib/rate-limit'
import { getCountyReport } from '@/lib/hub/reporting'
import { countAll } from '@/lib/prisma-helpers'

export async function GET(req: NextRequest) {
  const limited = await rateLimit(req, 'reports')
  if (limited) return limited
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  const items = await getCountyReport()
  return NextResponse.json({
    items: items.map((row) => ({
      county: row.county,
      count: countAll(row._count),
    })),
  })
}
