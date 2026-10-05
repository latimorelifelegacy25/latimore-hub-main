import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminSession } from '@/lib/ai/shared'
import { logger } from '@/lib/logger'
import { triggerVercelDeploy } from '@/lib/marketing/deploy'
import { publishBlockedBody } from '@/lib/marketing/approval-gate'
import { MARKETING_MANUAL_STATUSES, gateMarketingContent } from '@/lib/marketing/approval-gate-assets'

export async function publishMarketingContent(req: Request) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  try {
    const { id } = await req.json()

    if (typeof id !== 'string' || !id.trim()) {
      return NextResponse.json({ error: 'Content id is required' }, { status: 422 })
    }

    const existing = await prisma.marketingContent.findUnique({ where: { id } })
    if (existing) {
      const gate = await gateMarketingContent(existing, MARKETING_MANUAL_STATUSES)
      if (!gate.allowed) {
        logger.warn({ contentId: id }, '[approval-gate] marketing publish blocked')
        return NextResponse.json(publishBlockedBody(gate.blockers), { status: 422 })
      }
    }

    const deploy = await triggerVercelDeploy()
    if (!deploy.ok) {
      logger.warn({ deploy, contentId: id }, '[publishMarketingContent] deploy trigger did not succeed')
    }

    const updated = await prisma.marketingContent.update({
      where: { id },
      data: {
        status: 'published',
        publishedAt: new Date(),
        deployId: deploy.deployId ?? null,
        deployUrl: deploy.deployUrl ?? null,
        deployStatus: deploy.ok ? (deploy.status ?? 'queued') : deploy.mechanism === 'not_configured' ? 'not_configured' : 'failed',
      },
    })

    return NextResponse.json({ ...updated, deploy })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to publish content' }, { status: 500 })
  }
}
