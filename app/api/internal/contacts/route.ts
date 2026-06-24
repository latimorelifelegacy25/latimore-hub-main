import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 100

function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.INTERNAL_API_SECRET
  const provided = req.headers.get('x-internal-secret')
  if (!expected || !provided) return false

  const expectedBuf = Buffer.from(expected)
  const providedBuf = Buffer.from(provided)
  return expectedBuf.length === providedBuf.length && timingSafeEqual(expectedBuf, providedBuf)
}

// GET /api/internal/contacts?page=1&updatedSince=<ISO>
// Used by the Notion Worker (workers/src/index.ts) for backfill and delta syncs.
// Protected by INTERNAL_API_SECRET to prevent public access.
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const updatedSince = searchParams.get('updatedSince')

  const where = updatedSince ? { updatedAt: { gte: new Date(updatedSince) } } : {}

  const contacts = await prisma.contact.findMany({
    where,
    include: {
      inquiries: {
        orderBy: { createdAt: 'desc' as const },
        take: 1,
      },
    },
    orderBy: { updatedAt: 'asc' as const },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  })

  return NextResponse.json({
    contacts: contacts.map((c: typeof contacts[number]) => ({
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      phone: c.phone,
      county: c.county,
      primarySourceType: c.primarySourceType,
      nextFollowUpAt: c.nextFollowUpAt,
      updatedAt: c.updatedAt,
      inquiry: c.inquiries[0]
        ? {
            stage: c.inquiries[0].stage,
            productInterest: c.inquiries[0].productInterest,
          }
        : null,
    })),
    hasMore: contacts.length === PAGE_SIZE,
    page,
  })
}
