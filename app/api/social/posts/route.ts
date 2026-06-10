import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { publishSocialPostById } from '@/lib/social/publisher'
import type { CreateSocialPostInput, SocialPlatform } from '@/lib/social/types'

const PLATFORMS: SocialPlatform[] = ['facebook', 'instagram', 'linkedin']

function isPlatform(value: unknown): value is SocialPlatform {
  return typeof value === 'string' && PLATFORMS.includes(value as SocialPlatform)
}

function cleanString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function parseInput(value: unknown): CreateSocialPostInput {
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid request body.')
  }

  const body = value as Record<string, unknown>
  const caption = cleanString(body.caption)

  if (!caption) {
    throw new Error('Caption is required.')
  }

  const platforms = Array.isArray(body.platforms) ? body.platforms.filter(isPlatform) : []

  if (platforms.length === 0) {
    throw new Error('At least one platform is required: facebook, instagram, or linkedin.')
  }

  const mediaUrls = Array.isArray(body.mediaUrls)
    ? body.mediaUrls.filter((url): url is string => typeof url === 'string' && url.trim().length > 0)
    : []

  return {
    caption,
    platforms,
    campaign: cleanString(body.campaign),
    linkUrl: cleanString(body.linkUrl),
    mediaUrls,
    scheduledAt: typeof body.scheduledAt === 'string' ? body.scheduledAt : null,
    publishNow: body.publishNow === true,
  }
}

export async function GET() {
  const posts = await prisma.socialPost.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  })

  const connections = await prisma.socialConnection.findMany({
    where: {
      provider: {
        in: PLATFORMS,
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  })

  return NextResponse.json({ posts, connections })
}

export async function POST(request: NextRequest) {
  try {
    const input = parseInput(await request.json())
    const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null
    const status = input.publishNow ? 'approved' : scheduledAt ? 'scheduled' : 'draft'

    const posts = await Promise.all(
      input.platforms.map(platform =>
        prisma.socialPost.create({
          data: {
            platform,
            caption: input.caption,
            campaign: input.campaign,
            mediaUrls: input.mediaUrls,
            scheduledAt,
            status,
            metadata: {
              linkUrl: input.linkUrl,
              createdFrom: 'social-publisher-api',
            },
          },
        }),
      ),
    )

    if (!input.publishNow) {
      return NextResponse.json({ posts })
    }

    const results = []
    for (const post of posts) {
      try {
        const result = await publishSocialPostById(post.id)
        results.push({ id: post.id, ok: true, result })
      } catch (error) {
        results.push({ id: post.id, ok: false, error: error instanceof Error ? error.message : String(error) })
      }
    }

    return NextResponse.json({ posts, results })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to create social post.' },
      { status: 400 },
    )
  }
}
