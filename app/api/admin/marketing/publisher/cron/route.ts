export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { publishToPlatform } from '@/lib/marketing/social/meta'
import { requireCronAuth } from '@/lib/ai/shared'
import { evaluatePublishGate, stripHtml } from '@/lib/marketing/approval-gate'
import { logger } from '@/lib/logger'
import { auditGate, notifyHeld } from '@/lib/marketing/approval-gate-assets'

export async function GET(req: NextRequest) {
  const unauthorized = requireCronAuth(req)
  if (unauthorized) return unauthorized

  const now = new Date()

  const jobs = await prisma.socialPublishJob.findMany({
    where: {
      status: 'queued',
      scheduledFor: { lte: now },
    },
    include: { content: true },
  })

  for (const job of jobs) {
    const gate = evaluatePublishGate({
      text: [job.content.title, stripHtml(job.content.bodyHtml ?? '')].filter(Boolean).join('\n'),
      campaign: job.content.campaign,
      utmSource: job.content.utmSource,
    })
    await auditGate('social_publish_job', job.id, gate)
    if (!gate.allowed) {
      await notifyHeld('social_publish_job', job.id, gate)
      await prisma.socialPublishJob.update({ where: { id: job.id }, data: { status: 'failed' } })
      logger.warn({ jobId: job.id, contentId: job.content.id }, '[approval-gate] social publish job blocked and skipped')
      continue
    }
    try {
      await publishToPlatform(job.platform, {
        id: job.content.id,
        title: job.content.title,
        bodyHtml: job.content.bodyHtml ?? '',
        url: job.content.destination ?? undefined,
      })
      await prisma.socialPublishJob.update({
        where: { id: job.id },
        data: { status: 'sent' },
      })
    } catch (err) {
      console.error('[GET /api/admin/marketing/publisher/cron]', err)
      await prisma.socialPublishJob.update({
        where: { id: job.id },
        data: { status: 'failed' },
      })
    }
  }

  return NextResponse.json({ processed: jobs.length })
}
