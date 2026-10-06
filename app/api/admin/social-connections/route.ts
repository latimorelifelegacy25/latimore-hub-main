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

type TokenValidation = {
  error: string | null
  /** Raw profile payload from the provider's verification endpoint (when available). */
  profile: Record<string, unknown> | null
}

async function validateToken(provider: string, token: string): Promise<TokenValidation> {
  const endpoints: Record<string, string> = {
    linkedin: 'https://api.linkedin.com/v2/userinfo',
    twitter: 'https://api.twitter.com/2/users/me',
  }
  const url = endpoints[provider]
  if (!url) return { error: null, profile: null }
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
    if (!res.ok) {
      return { error: `${provider} rejected the token (HTTP ${res.status})`, profile: null }
    }
    let profile: Record<string, unknown> | null = null
    try {
      profile = (await res.json()) as Record<string, unknown>
    } catch {
      profile = null
    }
    return { error: null, profile }
  } catch {
    return { error: `Could not reach ${provider} to verify the token`, profile: null }
  }
}

/**
 * Derive the provider-specific external ID (author URN) from a verified token
 * when the caller did not supply one. LinkedIn publishing requires the member
 * URN (urn:li:person:{sub}); the userinfo `sub` claim carries the member ID.
 */
function deriveExternalId(
  provider: string,
  supplied: string | undefined,
  profile: Record<string, unknown> | null,
): string | undefined {
  if (supplied) return supplied
  if (provider === 'linkedin' && profile) {
    const sub = profile.sub
    if (typeof sub === 'string' && sub.length > 0) {
      return `urn:li:person:${sub}`
    }
  }
  return undefined
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

  let resolvedExternalId = externalId || undefined
  if (accessToken && status !== 'disconnected') {
    const validation = await validateToken(provider, accessToken)
    if (validation.error) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 })
    }
    resolvedExternalId = deriveExternalId(provider, resolvedExternalId, validation.profile)
  }

  const data: any = {
    provider,
    accountName: accountName || undefined,
    externalId: resolvedExternalId,
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
      externalId: resolvedExternalId,
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
