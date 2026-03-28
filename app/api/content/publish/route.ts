import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const now = new Date()
  const assets = await prisma.contentAsset.findMany({ where: { status: 'scheduled', scheduledFor: { lte: now } } })

  for (const asset of assets) {
    await prisma.contentAsset.update({ where: { id: asset.id }, data: { status: 'published', publishedAt: new Date() } })
    await prisma.systemEvent.create({ data: { type: 'content.published', payload: { assetId: asset.id } } })
  }

  return NextResponse.json({ ok: true, published: assets.length })
}
