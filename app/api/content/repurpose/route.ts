export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ContentStatus, ContentType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getPostBySlug } from '@/lib/blog'
import { repurposeContent, type SocialChannel } from '@/lib/ai/content-repurposing'
import {
  applyAiRateLimit,
  createAiRun,
  completeAiRun,
  createSystemAiEvent,
  failAiRun,
  requireAdminSession,
  requireCronAuth,
} from '@/lib/ai/shared'

const BodySchema = z.object({
  slug: z.string().min(1).max(200).optional(),
  title: z.string().min(1).max(255).optional(),
  content: z.string().min(20).optional(),
  coreMessage: z.string().max(2000).optional(),
  ctaLabel: z.string().max(150).optional(),
  ctaLink: z.string().max(500).optional(),
  tags: z.array(z.string()).optional(),
  campaign: z.string().max(150).optional(),
})

export async function POST(req: NextRequest) {
  const limited = await applyAiRateLimit(req)
  if (limited) return limited

  const isCron = !requireCronAuth(req)
  if (!isCron) {
    const auth = await requireAdminSession()
    if (!auth.ok) return auth.response
  }

  const body = await req.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 422 })

  const input = parsed.data
  let source = {
    title: input.title,
    slug: input.slug,
    content: input.content,
    coreMessage: input.coreMessage,
    ctaLabel: input.ctaLabel,
    ctaLink: input.ctaLink,
    tags: input.tags,
  }

  if (input.slug) {
    const loaded = getPostBySlug(input.slug)
    if (!loaded) return NextResponse.json({ ok: false, error: `Blog post not found: ${input.slug}` }, { status: 404 })
    source = {
      title: input.title ?? loaded.post.title,
      slug: input.slug,
      content: input.content ?? loaded.content,
      coreMessage: input.coreMessage ?? loaded.post.description,
      ctaLabel: input.ctaLabel,
      ctaLink: input.ctaLink,
      tags: input.tags ?? loaded.post.tags,
    }
  }

  if (!source.title || !source.content) {
    return NextResponse.json({ ok: false, error: 'slug (of an existing blog post) or title+content are required' }, { status: 400 })
  }

  const aiRun = await createAiRun({
    type: 'content_repurposing',
    input: { slug: source.slug ?? null, title: source.title },
  })

  try {
    const drafts = await repurposeContent({
      title: source.title,
      slug: source.slug ?? source.title,
      content: source.content,
      coreMessage: source.coreMessage,
      ctaLabel: source.ctaLabel,
      ctaLink: source.ctaLink,
      tags: source.tags,
    })

    const assets = await Promise.all(
      (Object.keys(drafts) as SocialChannel[]).map(channel => {
        const draft = drafts[channel]
        return prisma.contentAsset.create({
          data: {
            title: `${source.title} — ${channel}`,
            type: ContentType.social_post,
            status: ContentStatus.draft,
            channel,
            campaign: input.campaign ?? undefined,
            bodyText: draft.threadPosts ? draft.threadPosts.join('\n\n') : draft.caption,
            metadata: {
              sourceSlug: source.slug ?? null,
              caption: draft.caption,
              hashtags: draft.hashtags,
              threadPosts: draft.threadPosts ?? null,
              compliance: draft.compliance,
              model: draft.model,
            },
          },
        })
      }),
    )

    await completeAiRun({
      aiRunId: aiRun.id,
      output: { contentAssetIds: assets.map(a => a.id) },
    })

    await createSystemAiEvent({
      type: 'content.repurposed',
      payload: { sourceSlug: source.slug ?? null, contentAssetIds: assets.map(a => a.id) },
    })

    return NextResponse.json({ ok: true, aiRunId: aiRun.id, assets })
  } catch (error) {
    return failAiRun({ aiRunId: aiRun.id, error })
  }
}
