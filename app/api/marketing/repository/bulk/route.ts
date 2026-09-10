export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'
import { requireAdminSession } from '@/lib/ai/shared'
import { triggerVercelDeploy } from '@/lib/marketing/deploy'

const BulkUtmSchema = z.object({
  action: z.literal('utm'),
  ids: z.array(z.string()).min(1).max(200),
  campaign: z.string().trim().max(200).optional(),
  source: z.string().trim().max(100).optional(),
  medium: z.string().trim().max(100).optional(),
})

const BulkPublishSchema = z.object({
  action: z.literal('publish'),
  ids: z.array(z.string()).min(1).max(200),
})

const BodySchema = z.discriminatedUnion('action', [BulkUtmSchema, BulkPublishSchema])

// Apply UTM fields to many resources at once, or publish many at once with
// a single deploy trigger (not one per item) — matches the handoff spec's
// "Real batched writes + single deploy" requirement for bulk actions.
export async function PATCH(req: NextRequest) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  const limited = await rateLimit(req, 'inquiries')
  if (limited) return limited

  const body = await req.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  try {
    if (parsed.data.action === 'utm') {
      const { ids, campaign, source, medium } = parsed.data
      const data: Record<string, string> = {}
      if (campaign) data.campaign = campaign
      if (source) data.utmSource = source
      if (medium) data.utmMedium = medium

      if (Object.keys(data).length === 0) {
        return NextResponse.json({ error: 'No fields to apply' }, { status: 422 })
      }

      const result = await prisma.marketingContent.updateMany({
        where: { id: { in: ids } },
        data,
      })

      return NextResponse.json({ ok: true, updated: result.count })
    }

    const { ids } = parsed.data
    const now = new Date()
    await prisma.marketingContent.updateMany({
      where: { id: { in: ids } },
      data: { status: 'published', publishedAt: now },
    })

    const deploy = await triggerVercelDeploy()
    await prisma.marketingContent.updateMany({
      where: { id: { in: ids } },
      data: {
        deployId: deploy.deployId ?? null,
        deployUrl: deploy.deployUrl ?? null,
        deployStatus: deploy.ok ? (deploy.status ?? 'queued') : deploy.mechanism === 'not_configured' ? 'not_configured' : 'failed',
      },
    })

    if (!deploy.ok) {
      logger.warn({ deploy, ids }, '[marketing/repository/bulk] deploy trigger did not succeed')
    }

    return NextResponse.json({ ok: true, updated: ids.length, deploy })
  } catch (err) {
    logger.error({ err }, '[marketing/repository/bulk] failed')
    return NextResponse.json({ error: 'Bulk action failed' }, { status: 500 })
  }
}
