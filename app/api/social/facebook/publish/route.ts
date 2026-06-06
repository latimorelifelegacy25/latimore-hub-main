import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/ai/shared'
import { getSocialConnection } from '@/lib/social'
import { decryptToken } from '@/lib/crypto'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  const { content } = await req.json()

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
    return NextResponse.json(
      { ok: false, error: `Facebook publish failed: ${res.status} ${body}` },
      { status: res.status }
    )
  }

  const data = await res.json()

  return NextResponse.json({ ok: true, postId: data.id })
}
