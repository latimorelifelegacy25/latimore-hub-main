import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { getExcludedTrafficReason } from '@/lib/tracking/internal-traffic'

const schema = z.object({
  eventType: z.enum(['join_form_viewed', 'join_form_started', 'join_form_step_completed']),
  leadSessionId: z.string().min(1).max(191),
  source: z.string().max(100), medium: z.string().max(100), campaign: z.string().max(150),
  pageUrl: z.string().max(500), referrer: z.string().max(500).optional(),
  step: z.number().int().min(0).max(5).optional(),
})

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, 'event')
  if (limited) return limited
  const result = schema.safeParse(await req.json().catch(() => null))
  if (!result.success) return NextResponse.json({ ok: false }, { status: 422 })
  if (getExcludedTrafficReason(req, result.data.pageUrl)) return NextResponse.json({ ok: true, skipped: true })
  const { step, ...data } = result.data
  try {
    await prisma.joinFormEvent.create({ data: { ...data, metadata: step == null ? {} : { step } } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 })
  }
}
