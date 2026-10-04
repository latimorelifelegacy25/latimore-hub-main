export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminSession } from '@/lib/ai/shared'
import { encryptToken } from '@/lib/crypto'
import { SocialConnectionUpsertSchema } from '@/lib/schemas'

// Never return accessToken/refreshToken to the client.
const SAFE_CONNECTION_SELECT = {
  id: true,
  createdAt: true,
  updatedAt: true,
  provider: true,
  accountName: true,
  externalId: true,
  tokenExpiresAt: true,
  metadata: true,
  status: true,
}

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

  const connections = await socialConnectionModel.findMany({
    orderBy: { updatedAt: 'desc' },
    select: SAFE_CONNECTION_SELECT,
  })
  return NextResponse.json({ success: true, connections })
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  const parsed = SocialConnectionUpsertSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 422 })
  }
  const {
    provider,
    accountName,
    externalId,
    accessToken,
    refreshToken,
    tokenExpiresAt,
    metadata,
    status,
  } = parsed.data

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
        select: SAFE_CONNECTION_SELECT,
      })
    : await socialConnectionModel.create({ data, select: SAFE_CONNECTION_SELECT })

  return NextResponse.json({ success: true, connection })
}
