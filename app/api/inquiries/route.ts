export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/require-admin'
import { normalizeStage } from '@/lib/hub/normalizers'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req, 'inquiries')
  if (authError) return authError

  const { searchParams } = new URL(req.url)
  const stage = normalizeStage(searchParams.get('stage') ?? searchParams.get('status') ?? 'New')

  try {
    const items = await prisma.inquiry.findMany({
      where: { stage },
      orderBy: { createdAt: 'desc' },
      include: { contact: true },
    })
    return NextResponse.json({ items })
  } catch (err: any) {
    logger.error({ err: err.message }, 'Inquiries GET error')
    return NextResponse.json({ ok: false, error: 'server error' }, { status: 500 })
  }
}
