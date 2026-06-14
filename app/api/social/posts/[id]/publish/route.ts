import { NextRequest, NextResponse } from 'next/server'
import { publishSocialPostById } from '@/lib/social/publisher'
import { requireAdminSession } from '@/lib/ai/shared'

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

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
