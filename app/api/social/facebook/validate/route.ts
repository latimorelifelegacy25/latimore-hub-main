import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/ai/shared'
import { getSocialConnection } from '@/lib/social'
import { decryptToken } from '@/lib/crypto'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  const connection = await getSocialConnection('facebook')
  const accessToken = decryptToken(connection?.accessToken)
  const pageId = connection?.externalId

  if (!pageId || !accessToken) {
    return NextResponse.json({ ok: false, valid: false, error: 'No Facebook connection found' }, { status: 400 })
  }

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${pageId}?fields=access_token&access_token=${accessToken}`
  )
  const data = await res.json()

  return NextResponse.json({
    ok: true,
    valid: !data.error,
    daysUntilExpiry: 60,
  })
}
