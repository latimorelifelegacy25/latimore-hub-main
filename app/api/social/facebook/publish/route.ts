import { NextRequest, NextResponse } from 'next/server'
import { requireReviewerRole } from '@/lib/rbac'
import { rateLimit } from '@/lib/rate-limit'
import { FacebookPublishSchema } from '@/lib/schemas'
import { getSocialConnection } from '@/lib/social'
import { decryptToken } from '@/lib/crypto'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const auth = await requireReviewerRole()
  if (!auth.ok) return auth.response

  const limited = await rateLimit(req, 'adminSend', auth.email ?? undefined)
  if (limited) return limited

  const parsed = FacebookPublishSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 422 })
  }
  const { content } = parsed.data

  const conn = await getSocialConnection('facebook')
  const accessToken = decryptToken(conn?.accessToken)

  if (!conn?.externalId || !accessToken) {
    return NextResponse.json(
      { ok: false, error: 'Facebook not connected' },
      { status: 400 }
    )
  }

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${conn.externalId}/feed`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: content,
        access_token: accessToken,
      }),
    }
  )

  if (!res.ok) {
    const body = await res.text()
    logger.error({ status: res.status, body }, 'Facebook publish failed')
    return NextResponse.json(
      { ok: false, error: `Facebook publish failed (${res.status})` },
      { status: 502 }
    )
  }

  const data = await res.json()

  return NextResponse.json({ ok: true, postId: data.id })
}
