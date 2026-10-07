import { NextResponse } from 'next/server'
import { checkConnectionHealth } from '@/lib/social/publisher'
import { requireAdminSession } from '@/lib/ai/shared'
import type { SocialPlatform } from '@/lib/social/types'

export const dynamic = 'force-dynamic'

const PLATFORMS: SocialPlatform[] = ['facebook', 'linkedin', 'gbp']

/**
 * GET /api/social/connections/health?platform=linkedin
 *
 * Pre-publish connection health check. Validates the stored token is live
 * and attempts one automatic refresh when a refresh token exists.
 * Called by the social automation crons ~30 min before publish so a dead
 * token is caught while there is still time to re-auth — never at 9 AM
 * with a shrug.
 */
export async function GET(request: Request) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const platform = (searchParams.get('platform') ?? 'linkedin') as SocialPlatform

  if (!PLATFORMS.includes(platform)) {
    return NextResponse.json(
      { ok: false, error: `Unsupported platform: ${platform}` },
      { status: 400 },
    )
  }

  try {
    const health = await checkConnectionHealth(platform)
    return NextResponse.json({ ok: health.ok, platform, detail: health.detail })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        platform,
        detail: error instanceof Error ? error.message : 'Health check failed.',
      },
      { status: 500 },
    )
  }
}
