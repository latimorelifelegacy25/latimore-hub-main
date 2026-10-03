import { NextRequest, NextResponse } from 'next/server'
import { submitVirtualIntake } from '@/lib/virtual-intake'
import { rateLimit } from '@/lib/rate-limit'
import { VirtualIntakeSchema } from '@/lib/schemas'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, 'intake')
  if (limited) return limited

  try {
    const body = await request.json().catch(() => null)
    if (!body) return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })

    const parsed = VirtualIntakeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 422 })
    }

    const result = await submitVirtualIntake(parsed.data)
    return NextResponse.json({ ok: true, leadId: result.leadId })
  } catch (error) {
    logger.error({ err: error instanceof Error ? error.message : String(error) }, 'Intake submission error')
    return NextResponse.json({ ok: false, error: 'Intake submission failed.' }, { status: 400 })
  }
}
