export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminSession } from '@/lib/ai/shared'

export async function POST(req: Request) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

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
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  const jobs = await prisma.socialPublishJob.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json(jobs)
}
