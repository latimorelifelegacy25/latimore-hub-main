import { NextRequest, NextResponse } from 'next/server'
import { requireCronAuth } from '@/lib/ai/shared'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const PLATFORMS = ['facebook', 'instagram', 'linkedin', 'twitter', 'website'] as const

export async function GET(req: NextRequest) {
  const unauthorized = requireCronAuth(req)
  if (unauthorized) return unauthorized

  const startedAt = new Date()
  const platforms = await Promise.all(
    PLATFORMS.map(async (platform) => {
      const configured = await prisma.socialAccount.count({ where: { platform, isActive: true } }).catch(() => 0)
      if (!configured) {
        return { platform, status: 'skipped' as const, posts: 0, metrics: 0, comments: 0, error: 'No active account configured' }
      }
      return { platform, status: 'skipped' as const, posts: 0, metrics: 0, comments: 0, error: 'Adapter ingestion not connected in this PR' }
    })
  )

  await prisma.systemEvent.create({ data: { type: 'social_sync_checked', source: 'cron', payload: { platforms } } }).catch(() => null)

  return NextResponse.json({ ok: true, startedAt: startedAt.toISOString(), completedAt: new Date().toISOString(), platforms })
}
