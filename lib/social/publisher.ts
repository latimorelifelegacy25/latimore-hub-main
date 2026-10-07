import { prisma } from '@/lib/prisma'
import { decryptToken, encryptToken } from '@/lib/crypto'
import { publishLinkedInPost } from './linkedin-publisher'
import { publishFacebookPagePost, publishInstagramPost } from './meta-publisher'
import { getOneUpSocialAccountId, isOneUpConfigured, publishViaOneUp } from './oneup-publisher'
import { refreshLinkedInAccessToken, isLinkedInTokenValid } from './linkedin-refresh'
import { appendUtmParams } from './url'
import type { SocialProvider } from '@prisma/client'
import type { PublishPayload, PublishResult, PublishTarget, SocialPlatform } from './types'

// Platforms with a native OAuth connection stored in SocialConnection.
// 'gbp' has no native row (the GBP connect flow stores elsewhere) and is
// served exclusively through OneUp.
const NATIVE_PROVIDERS: SocialProvider[] = ['facebook', 'instagram', 'linkedin']

type SocialPostRecord = {
  id: string
  platform: string
  caption: string
  campaign: string | null
  mediaUrls: unknown
  metadata: unknown
}

function getMediaUrls(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.length > 0)
  }

  return []
}

function getMetadataObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }

  return {}
}

async function getConnection(platform: SocialPlatform): Promise<PublishTarget | null> {
  if (!NATIVE_PROVIDERS.includes(platform as SocialProvider)) {
    return null
  }

  const connection = await prisma.socialConnection.findFirst({
    where: {
      provider: platform as SocialProvider,
      status: {
        in: ['active', 'connected', 'enabled'],
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  })

  if (!connection) {
    return null
  }

  // Tokens are stored encrypted at rest (see lib/crypto.ts); decrypt before
  // handing them to the provider SDKs/APIs. Legacy plain-text rows pass through.
  // Refresh token + expiry are included so the publisher can self-heal expired
  // access tokens instead of failing the post.
  return {
    platform,
    externalId: connection.externalId,
    accountName: connection.accountName,
    accessToken: decryptToken(connection.accessToken),
    refreshToken: connection.refreshToken ? decryptToken(connection.refreshToken) : null,
    tokenExpiresAt: connection.tokenExpiresAt,
    connectionId: connection.id,
    metadata: connection.metadata,
  }
}

/**
 * Proactively refresh a LinkedIn access token if it is expired or expiring
 * within 5 minutes. Updates the SocialConnection row in place and returns
 * the (possibly new) access token. Returns the original token if no refresh
 * is needed or possible.
 */
async function ensureFreshLinkedInToken(target: PublishTarget): Promise<string | null> {
  const accessToken = target.accessToken
  if (!accessToken) return null

  const needsRefresh =
    target.tokenExpiresAt && target.tokenExpiresAt.getTime() - Date.now() < 5 * 60 * 1000

  if (!needsRefresh) return accessToken
  if (!target.refreshToken || !target.connectionId) return accessToken

  const refreshed = await refreshLinkedInAccessToken(target.refreshToken)
  await prisma.socialConnection.update({
    where: { id: target.connectionId },
    data: {
      accessToken: encryptToken(refreshed.accessToken),
      refreshToken: encryptToken(refreshed.refreshToken),
      tokenExpiresAt: new Date(Date.now() + refreshed.expiresIn * 1000),
    },
  })
  target.accessToken = refreshed.accessToken
  target.refreshToken = refreshed.refreshToken
  return refreshed.accessToken
}

/**
 * Check whether a platform's native connection is healthy before publish.
 * For LinkedIn: validates the access token is live; attempts one refresh
 * if a refresh token is stored. Returns { ok, detail }.
 */
export async function checkConnectionHealth(
  platform: SocialPlatform,
): Promise<{ ok: boolean; detail: string }> {
  const target = await getConnection(platform)
  if (!target?.accessToken) {
    return { ok: false, detail: `No active ${platform} connection found.` }
  }

  if (platform === 'linkedin') {
    // Proactive refresh if expiring.
    try {
      await ensureFreshLinkedInToken(target)
    } catch (err) {
      return {
        ok: false,
        detail: `LinkedIn token refresh failed: ${err instanceof Error ? err.message : String(err)}. Re-auth required before publishing.`,
      }
    }
    const valid = await isLinkedInTokenValid(target.accessToken!)
    if (!valid) {
      // One reactive refresh attempt before declaring dead.
      if (target.refreshToken && target.connectionId) {
        try {
          const refreshed = await refreshLinkedInAccessToken(target.refreshToken)
          await prisma.socialConnection.update({
            where: { id: target.connectionId },
            data: {
              accessToken: encryptToken(refreshed.accessToken),
              refreshToken: encryptToken(refreshed.refreshToken),
              tokenExpiresAt: new Date(Date.now() + refreshed.expiresIn * 1000),
            },
          })
          return { ok: true, detail: 'LinkedIn token was expired; refreshed automatically.' }
        } catch (err) {
          return {
            ok: false,
            detail: `LinkedIn token invalid and refresh failed: ${err instanceof Error ? err.message : String(err)}. Re-auth required before publishing.`,
          }
        }
      }
      return {
        ok: false,
        detail:
          'LinkedIn token invalid or expired and no refresh token stored. Generate a fresh token from LinkedIn developer console and save it via Social OS → LinkedIn → Establish Protocol.',
      }
    }
    return { ok: true, detail: 'LinkedIn token valid.' }
  }

  return { ok: true, detail: `${platform} connection present (no live validation implemented).` }
}

async function dispatchPublish(
  platform: SocialPlatform,
  target: PublishTarget | null,
  payload: PublishPayload,
): Promise<PublishResult & { via: 'native' | 'oneup' }> {
  if (target) {
    if (target.platform === 'facebook') {
      return { ...(await publishFacebookPagePost(target, payload)), via: 'native' }
    }
    if (target.platform === 'instagram') {
      return { ...(await publishInstagramPost(target, payload)), via: 'native' }
    }
    if (target.platform === 'linkedin') {
      // Proactive refresh if the token is expired/expiring, then one
      // reactive retry on 401 before giving up. A dead token must never
      // silently kill a post when a refresh token is available.
      try {
        await ensureFreshLinkedInToken(target)
      } catch {
        // Proactive refresh failed; fall through and let the publish
        // attempt surface the real error.
      }
      try {
        return { ...(await publishLinkedInPost(target, payload)), via: 'native' }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        const isAuthFailure = /HTTP 401|INVALID_ACCESS_TOKEN|invalid.*token/i.test(msg)
        if (isAuthFailure && target.refreshToken && target.connectionId) {
          const refreshed = await refreshLinkedInAccessToken(target.refreshToken)
          await prisma.socialConnection.update({
            where: { id: target.connectionId },
            data: {
              accessToken: encryptToken(refreshed.accessToken),
              refreshToken: encryptToken(refreshed.refreshToken),
              tokenExpiresAt: new Date(Date.now() + refreshed.expiresIn * 1000),
            },
          })
          target.accessToken = refreshed.accessToken
          return { ...(await publishLinkedInPost(target, payload)), via: 'native' }
        }
        throw err
      }
    }
  }

  // No native OAuth connection: fall back to OneUp via Composio when configured.
  if (isOneUpConfigured() && getOneUpSocialAccountId(platform)) {
    const result = await publishViaOneUp(platform, {
      caption: payload.caption,
      mediaUrls: payload.mediaUrls,
    })
    return { ...result, via: 'oneup' }
  }

  throw new Error(
    `No active ${platform} connection found and OneUp publishing is not configured for it.`,
  )
}

export async function publishSocialPostById(postId: string): Promise<PublishResult> {
  const post = (await prisma.socialPost.findUnique({
    where: { id: postId },
  })) as SocialPostRecord | null

  if (!post) {
    throw new Error(`Social post not found: ${postId}`)
  }

  const platform = post.platform as SocialPlatform
  // Native OAuth connection first; falls back to OneUp via Composio when none exists.
  const target = await getConnection(platform)
  const metadata = getMetadataObject(post.metadata)
  const linkUrl = typeof metadata.linkUrl === 'string' ? metadata.linkUrl : null
  const taggedUrl = appendUtmParams(linkUrl, {
    source: platform,
    medium: 'social',
    campaign: post.campaign ?? undefined,
    content: post.id,
  })

  await prisma.socialPost.update({
    where: { id: post.id },
    data: {
      status: 'approved',
      metadata: {
        ...metadata,
        publishingStartedAt: new Date().toISOString(),
        taggedUrl,
      },
    },
  })

  try {
    const result = await dispatchPublish(platform, target, {
      caption: post.caption,
      linkUrl: taggedUrl,
      mediaUrls: getMediaUrls(post.mediaUrls),
    })

    await prisma.socialPost.update({
      where: { id: post.id },
      data: {
        status: 'published',
        externalPostId: result.externalPostId,
        publishedAt: new Date(),
        rawPublishResult: result.raw as object,
        metadata: {
          ...metadata,
          taggedUrl,
          publishVia: result.via,
        },
      },
    })

    return result
  } catch (error) {
    await prisma.socialPost.update({
      where: { id: post.id },
      data: {
        status: 'failed',
        metadata: {
          ...metadata,
          taggedUrl,
          publishError: error instanceof Error ? error.message : String(error),
          failedAt: new Date().toISOString(),
        },
      },
    })

    throw error
  }
}

export async function publishDueSocialPosts(limit = 10) {
  const now = new Date()
  const posts = await prisma.socialPost.findMany({
    where: {
      status: 'scheduled',
      scheduledAt: {
        lte: now,
      },
    },
    orderBy: {
      scheduledAt: 'asc',
    },
    take: limit,
  })

  const results = []

  for (const post of posts) {
    try {
      const result = await publishSocialPostById(post.id)
      results.push({ id: post.id, ok: true, result })
    } catch (error) {
      results.push({ id: post.id, ok: false, error: error instanceof Error ? error.message : String(error) })
    }
  }

  return results
}
