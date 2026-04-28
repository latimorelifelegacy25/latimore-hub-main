import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSystemAiEvent } from '@/lib/ai/shared'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const isCron = cronSecret && req.headers.get("x-cron-secret") === cronSecret

  if (!isCron) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()

    // Find all scheduled content assets that are due to be published
    const dueContent = await prisma.contentAsset.findMany({
      where: {
        status: 'scheduled',
        scheduledFor: {
          lte: now
        }
      }
    })

    if (dueContent.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No content due for publishing',
        published: 0
      })
    }

    // Update status to published
    const updatePromises = dueContent.map(asset =>
      prisma.contentAsset.update({
        where: { id: asset.id },
        data: {
          status: 'published',
          publishedAt: now
        }
      })
    )

    await Promise.all(updatePromises)

    // Create system events for each published item
    const eventPromises = dueContent.map(asset =>
      createSystemAiEvent({
        type: 'content.published',
        payload: {
          assetId: asset.id,
          type: asset.type,
          channel: asset.channel,
          scheduledFor: asset.scheduledFor
        }
      })
    )

    await Promise.all(eventPromises)

    return NextResponse.json({
      success: true,
      message: `Published ${dueContent.length} content items`,
      published: dueContent.length,
      items: dueContent.map(asset => ({
        id: asset.id,
        title: asset.title,
        type: asset.type,
        channel: asset.channel
      }))
    })

  } catch (error) {
    console.error('Content publishing cron error:', error)
    return NextResponse.json(
      { error: 'Failed to publish scheduled content' },
      { status: 500 }
    )
  }
}