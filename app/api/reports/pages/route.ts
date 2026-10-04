export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/ai/shared'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  const limited = await rateLimit(req, 'reports')
  if (limited) return limited
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  const items = await prisma.$queryRaw<Array<{ page: string | null; count: bigint | number }>>`
    SELECT "pageUrl" AS page, COUNT(*) AS count
    FROM "Event"
    WHERE "pageUrl" IS NOT NULL
    GROUP BY 1
    ORDER BY COUNT(*) DESC
    LIMIT 50
  `

  return NextResponse.json({
    items: items.map((row) => ({ page: row.page, count: Number(row.count) })),
  })
}
