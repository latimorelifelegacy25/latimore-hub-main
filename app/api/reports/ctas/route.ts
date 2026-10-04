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

  const items = await prisma.$queryRaw<Array<{ label: string | null; count: bigint | number }>>`
    SELECT COALESCE(metadata->>'buttonLabel', metadata->>'label', metadata->>'buttonId', 'Unknown') AS label, COUNT(*) AS count
    FROM "Event"
    WHERE "eventType" IN ('cta_click', 'call_click', 'text_click', 'email_click', 'book_click')
    GROUP BY 1
    ORDER BY COUNT(*) DESC
    LIMIT 50
  `

  return NextResponse.json({
    items: items.map((row) => ({ label: row.label, count: Number(row.count) })),
  })
}
