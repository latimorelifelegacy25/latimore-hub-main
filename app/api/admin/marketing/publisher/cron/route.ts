import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { publishToPlatform } from '@/lib/marketing/social/meta'

export async function GET() {
  const now = new Date()

  const jobs = await prisma.socialPublishJob.findMany({
    where: {
      status: 'queued',
      scheduledFor: { lte: now },
    },
    include: { content: true },
  })

  for (const job of jobs) {
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
