export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'
import { requireAdminSession } from '@/lib/ai/shared'
import { DESTINATIONS, slugify } from '@/lib/marketing/repository'
import { triggerVercelDeploy } from '@/lib/marketing/deploy'

export async function GET() {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  try {
    const items = await prisma.marketingContent.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(items)
  } catch (err) {
    logger.error({ err }, '[marketing/repository] failed to load')
    return NextResponse.json({ error: 'Failed to load repository' }, { status: 500 })
  }
}

const CreateSchema = z.object({
  title: z.string().trim().min(1).max(300),
  type: z.enum(['article', 'link', 'pdf', 'doc', 'video']),
  status: z.enum(['draft', 'published', 'scheduled']).default('draft'),
  campaign: z.string().trim().min(1).max(200),
  destination: z.string().trim().min(1),
  utmSource: z.string().trim().max(100).optional().nullable(),
  utmMedium: z.string().trim().max(100).optional().nullable(),
  utmContent: z.string().trim().max(200).optional().nullable(),
  sourceUrl: z.string().trim().max(2000).optional().nullable(),
  domain: z.string().trim().max(300).optional().nullable(),
  fileName: z.string().trim().max(500).optional().nullable(),
  fileSizeBytes: z.number().int().positive().optional().nullable(),
  bodyHtml: z.string().max(500_000).optional().nullable(),
  author: z.string().trim().max(200).optional().nullable(),
  category: z.string().trim().max(100).optional().nullable(),
  coverImageUrl: z.string().trim().max(2000).optional().nullable(),
  scheduledFor: z.string().datetime().optional().nullable(),
})

export async function POST(req: NextRequest) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  const limited = await rateLimit(req, 'inquiries')
  if (limited) return limited

  const body = await req.json().catch(() => null)
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }
  const data = parsed.data

  const isArticle = data.type === 'article'
  const slug = isArticle ? slugify(data.title) : null
  const dest = DESTINATIONS.find((d) => d.id === data.destination)
  const sourceUrl = isArticle
    ? `https://www.latimorelifelegacy.com${dest?.path ?? ''}/${slug}`
    : data.sourceUrl ?? null

  const now = new Date()
  const publishNow = data.status === 'published'

  try {
    const created = await prisma.marketingContent.create({
      data: {
        title: data.title,
        type: data.type,
        status: data.status,
        bodyHtml: data.bodyHtml ?? '',
        campaign: data.campaign,
        destination: data.destination,
        utmSource: data.utmSource ?? null,
        utmMedium: data.utmMedium ?? null,
        utmContent: data.utmContent ?? null,
        sourceUrl,
        domain: data.domain ?? null,
        author: data.author ?? null,
        category: data.category ?? null,
        coverImageUrl: data.coverImageUrl ?? null,
        slug,
        fileName: data.fileName ?? null,
        fileSizeBytes: data.fileSizeBytes ?? null,
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
        publishedAt: publishNow ? now : null,
      },
    })

    if (!publishNow) {
      return NextResponse.json(created, { status: 201 })
    }

    const deploy = await triggerVercelDeploy()
    const updated = await prisma.marketingContent.update({
      where: { id: created.id },
      data: {
        deployId: deploy.deployId ?? null,
        deployUrl: deploy.deployUrl ?? null,
        deployStatus: deploy.ok ? (deploy.status ?? 'queued') : deploy.mechanism === 'not_configured' ? 'not_configured' : 'failed',
      },
    })

    if (!deploy.ok) {
      logger.warn({ deploy, contentId: created.id }, '[marketing/repository] deploy trigger did not succeed')
    }

    return NextResponse.json({ ...updated, deploy }, { status: 201 })
  } catch (err) {
    logger.error({ err }, '[marketing/repository] create failed')
    return NextResponse.json({ error: 'Failed to save content' }, { status: 500 })
  }
}
