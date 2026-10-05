export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { publishSocialPost } from '@/lib/social'
import { requireAdminSession } from '@/lib/ai/shared'
import { gateContentAsset, holdBlockedAsset } from '@/lib/marketing/approval-gate-assets'

export async function POST() {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  const now = new Date()
  const assets = await prisma.contentAsset.findMany({ where: { status: 'scheduled', scheduledFor: { lte: now } } })
  let publishedCount = 0

  for (const asset of assets) {
    const gate = await gateContentAsset(asset)
    if (!gate.allowed) {
      await holdBlockedAsset(asset, gate)
      await prisma.systemEvent.create({ data: { type: 'content.publish_blocked', payload: { assetId: asset.id, channel: asset.channel } } })
      continue
    }
    try {
      await publishSocialPost(asset)
      await prisma.contentAsset.update({ where: { id: asset.id }, data: { status: 'published', publishedAt: new Date() } })
      await prisma.systemEvent.create({ data: { type: 'content.published', payload: { assetId: asset.id, channel: asset.channel } } })
      publishedCount += 1
    } catch (error) {
      await prisma.systemEvent.create({
        data: {
          type: 'content.publish_failed',
          payload: {
            assetId: asset.id,
            channel: asset.channel,
            error: error instanceof Error ? error.message : String(error),
          },
        },
      })
    }
  }

  return NextResponse.json({ ok: true, published: publishedCount, total: assets.length })
}
