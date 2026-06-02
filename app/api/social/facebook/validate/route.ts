import { NextRequest, NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/ai/shared'
import { getSocialConnection } from '@/lib/social'
import { inspectToken } from '@/lib/social/facebook-oauth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(req.url)
  const pageId = searchParams.get('pageId')

  const connection = pageId
    ? await (async () => {
        const { prisma } = await import('@/lib/prisma')
        return (prisma as any).socialConnection.findFirst({
          where: { provider: 'facebook', externalId: pageId },
        })
      })()
    : await getSocialConnection('facebook')

  if (!connection?.accessToken) {
    return NextResponse.json({ ok: false, valid: false, error: 'No Facebook connection found' }, { status: 400 })
  }

  try {
    const tokenInfo = await inspectToken(connection.accessToken)
    const expiresAt = tokenInfo.expires_at ? new Date(tokenInfo.expires_at * 1000) : null
    return NextResponse.json({
      ok: true,
      valid: tokenInfo.is_valid,
      scopes: tokenInfo.scopes,
      expiresAt: expiresAt?.toISOString() ?? null,
      daysUntilExpiry: expiresAt
        ? Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 86_400_000))
        : null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Token validation failed'
    return NextResponse.json({ ok: false, valid: false, error: message }, { status: 200 })
  }
}
