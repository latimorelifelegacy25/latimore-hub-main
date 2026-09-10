export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireCronAuth } from '@/lib/ai/shared'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { triggerVercelDeploy } from '@/lib/marketing/deploy'

// Publishes Content Repository items whose scheduled date has arrived, then
// triggers one deploy for the batch. Wired into the daily cron fan-out
// (app/api/cron/daily/route.ts).
export async function GET(req: NextRequest) {
  const authError = requireCronAuth(req)
  if (authError) return authError

  const now = new Date()
  const due = await prisma.marketingContent.findMany({
    where: { status: 'scheduled', scheduledFor: { lte: now } },
    take: 50,
  })

  if (due.length === 0) {
    return NextResponse.json({ ok: true, published: 0 })
  }

  const ids = due.map((item) => item.id)

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
    logger.warn({ deploy, ids }, '[cron/marketing-scheduled-publish] deploy trigger did not succeed')
  }

  logger.info({ published: ids.length }, '[cron/marketing-scheduled-publish] complete')
  return NextResponse.json({ ok: true, published: ids.length, deploy })
}
