export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminSession } from '@/lib/ai/shared'
import { encryptToken } from '@/lib/crypto'

async function validateToken(provider: string, token: string): Promise<string | null> {
  const endpoints: Record<string, string> = {
    linkedin: 'https://api.linkedin.com/v2/userinfo',
    twitter: 'https://api.twitter.com/2/users/me',
  }
  const url = endpoints[provider]
  if (!url) return null
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
    return res.ok ? null : `${provider} rejected the token (HTTP ${res.status})`
  } catch {
    return `Could not reach ${provider} to verify the token`
  }
}

export async function GET() {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  const socialConnectionModel = (prisma as any).socialConnection
  if (!socialConnectionModel) {
    return NextResponse.json(
      { success: false, error: 'SocialConnection model unavailable. Run prisma generate after schema changes.' },
      { status: 501 },
    )
  }

  const connections = await socialConnectionModel.findMany({ orderBy: { updatedAt: 'desc' } })
  return NextResponse.json({ success: true, connections })
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  const body = await req.json()
  const {
    provider,
    accountName,
    externalId,
    accessToken,
    refreshToken,
    tokenExpiresAt,
    metadata,
    status,
  } = body

  if (!provider) {
    return NextResponse.json({ success: false, error: 'provider is required' }, { status: 400 })
  }

  if (accessToken && status !== 'disconnected') {
    const invalid = await validateToken(provider, accessToken)
    if (invalid) {
      return NextResponse.json({ success: false, error: invalid }, { status: 400 })
    }
  }

  const data: any = {
    provider,
    accountName: accountName || undefined,
    externalId: externalId || undefined,
    accessToken: accessToken ? encryptToken(accessToken) : undefined,
    refreshToken: refreshToken ? encryptToken(refreshToken) : undefined,
    metadata: metadata || undefined,
    status: status || undefined,
  }

  if (tokenExpiresAt) {
    const expiresAt = new Date(tokenExpiresAt)
    if (!Number.isNaN(expiresAt.getTime())) {
      data.tokenExpiresAt = expiresAt
    }
  }

  const socialConnectionModel = (prisma as any).socialConnection
  if (!socialConnectionModel) {
    return NextResponse.json(
      { success: false, error: 'SocialConnection model unavailable. Run prisma generate after schema changes.' },
      { status: 501 },
    )
  }

  const existing = await socialConnectionModel.findFirst({
    where: {
      provider,
      externalId: externalId || undefined,
    },
  })

  const connection = existing
    ? await socialConnectionModel.update({
        where: { id: existing.id },
        data,
      })
    : await socialConnectionModel.create({ data })

  return NextResponse.json({ success: true, connection })
}
