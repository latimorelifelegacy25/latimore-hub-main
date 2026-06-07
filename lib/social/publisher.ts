import { prisma } from '@/lib/prisma'
import { publishLinkedInPost } from './linkedin-publisher'
import { publishFacebookPagePost, publishInstagramPost } from './meta-publisher'
import { appendUtmParams } from './url'
import type { PublishPayload, PublishResult, PublishTarget, SocialPlatform } from './types'

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

async function getConnection(platform: SocialPlatform): Promise<PublishTarget> {
  const connection = await prisma.socialConnection.findFirst({
    where: {
      provider: platform,
      status: {
        in: ['active', 'connected', 'enabled'],
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  })

  if (!connection) {
    throw new Error(`No active ${platform} connection found.`)
  }

  return {
    platform,
    externalId: connection.externalId,
    accountName: connection.accountName,
    accessToken: connection.accessToken,
    metadata: connection.metadata,
  }
}

async function dispatchPublish(target: PublishTarget, payload: PublishPayload): Promise<PublishResult> {
  if (target.platform === 'facebook') return publishFacebookPagePost(target, payload)
  if (target.platform === 'instagram') return publishInstagramPost(target, payload)
  if (target.platform === 'linkedin') return publishLinkedInPost(target, payload)

  throw new Error(`Unsupported platform: ${target.platform}`)
}

export async function publishSocialPostById(postId: string): Promise<PublishResult> {
  const post = (await prisma.socialPost.findUnique({
    where: { id: postId },
  })) as SocialPostRecord | null

  if (!post) {
    throw new Error(`Social post not found: ${postId}`)
  }

  const platform = post.platform as SocialPlatform
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
    const result = await dispatchPublish(target, {
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
