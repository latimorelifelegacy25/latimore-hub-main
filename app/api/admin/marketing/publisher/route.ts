import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const data = await req.json()

  const job = await prisma.socialPublishJob.create({
    data: {
      platform: data.platform,
      contentId: data.contentId,
      status: 'queued',
      scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
    },
  })

  return NextResponse.json(job)
}

export async function GET() {
  const jobs = await prisma.socialPublishJob.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json(jobs)
}
