import { NextResponse } from 'next/server'
import { submitVirtualIntake } from '@/lib/virtual-intake'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const result = await submitVirtualIntake(payload)
    return NextResponse.json({ ok: true, leadId: result.leadId })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Intake submission failed.'
    return NextResponse.json({ ok: false, error: message }, { status: 400 })
  }
}
