import { prisma } from '@/lib/prisma'
import { publishLinkedInPost } from './linkedin-publisher'
import { publishFacebookPagePost, publishInstagramPost } from './meta-publisher'
import { getOneUpSocialAccountId, isOneUpConfigured, publishViaOneUp } from './oneup-publisher'
import { appendUtmParams } from './url'
import { logger } from '@/lib/logger'
import {
  MANUAL_PUBLISHABLE_STATUSES,
  PublishBlockedError,
  evaluatePublishGate,
} from '@/lib/marketing/approval-gate'
import { auditGate, notifyHeld } from '@/lib/marketing/approval-gate-assets'
import type { SocialProvider } from '@prisma/client'
import type { PublishPayload, PublishResult, PublishTarget, SocialPlatform } from './types'

// Platforms with a native OAuth connection stored in SocialConnection.
// 'gbp' has no native row (the GBP connect flow stores elsewhere) and is
// served exclusively through OneUp.
const NATIVE_PROVIDERS: SocialProvider[] = ['facebook', 'instagram', 'linkedin']

type SocialPostRecord = {
  id: string
  platform: string
  status?: string
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

  return {
    platform,
    externalId: connection.externalId,
    accountName: connection.accountName,
    accessToken: connection.accessToken,
    metadata: connection.metadata,
  }
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
      return { ...(await publishLinkedInPost(target, payload)), via: 'native' }
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

  const gate = evaluatePublishGate({
    text: post.caption,
    status: post.status,
    allowedStatuses: MANUAL_PUBLISHABLE_STATUSES,
    campaign: post.campaign,
  })
  await auditGate('social_post', post.id, gate)
  if (!gate.allowed) {
    // Mark (never delete) so scheduled runs do not re-select it; ids only in logs.
    const blockedMeta = getMetadataObject(post.metadata)
    if (post.status !== 'published' && post.status !== 'archived') {
      await prisma.socialPost.update({
        where: { id: post.id },
        data: {
          status: 'failed',
          metadata: {
            ...blockedMeta,
            publishBlocked: { at: new Date().toISOString(), blockers: gate.blockers },
          },
        },
      })
    }
    logger.warn({ postId: post.id }, '[approval-gate] social post blocked')
    if (post.status === 'scheduled') await notifyHeld('social_post', post.id, gate)
    throw new PublishBlockedError(gate.blockers)
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
