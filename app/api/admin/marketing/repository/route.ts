import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const items = await prisma.contentResource.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json(items)
}

export async function POST(req: Request) {
  const data = await req.json()

  const created = await prisma.contentResource.create({
    data: {
      title: data.title,
      type: data.type,
      status: data.status ?? 'draft',
      bodyHtml: data.bodyHtml ?? '',
      campaign: data.campaign ?? null,
      destination: data.destination ?? null,
      utmSource: data.utmSource ?? null,
      publishAt: data.publishAt ? new Date(data.publishAt) : null,
    },
  })

  return NextResponse.json(created)
}
