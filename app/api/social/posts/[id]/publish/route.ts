import { NextRequest, NextResponse } from 'next/server'
import { publishSocialPostById } from '@/lib/social/publisher'

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const result = await publishSocialPostById(id)
    return NextResponse.json({ ok: true, result })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unable to publish social post.' },
      { status: 400 },
    )
  }
}
