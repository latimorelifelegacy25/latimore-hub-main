export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { normalizeStage } from '@/lib/hub/normalizers'

export async function GET(req: NextRequest) {
  const limited = rateLimit(req, 'inquiries')
  if (limited) return limited

  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const stage = normalizeStage(searchParams.get('stage') ?? searchParams.get('status') ?? 'New')

  const items = await prisma.inquiry.findMany({
    where: { stage },
    orderBy: { createdAt: 'desc' },
    include: { contact: true },
  })

  return NextResponse.json({ items })
}
