import { NextRequest, NextResponse } from 'next/server'
import { submitVirtualIntake } from '@/lib/virtual-intake'
import { rateLimit } from '@/lib/rate-limit'
import { VirtualIntakeSchema } from '@/lib/schemas'
import { ZodError } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, 'intake')
  if (limited) return limited

  try {
    const body = await request.json()
    const payload = VirtualIntakeSchema.parse(body)
    const result = await submitVirtualIntake(payload)
    return NextResponse.json({ ok: true, leadId: result.leadId })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ ok: false, error: error.flatten() }, { status: 422 })
    }
    const message = error instanceof Error ? error.message : 'Intake submission failed.'
    return NextResponse.json({ ok: false, error: message }, { status: 400 })
  }
}
