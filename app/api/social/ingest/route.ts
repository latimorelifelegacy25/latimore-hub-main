import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Normalize platform-specific metric field names into our schema
function normalizeMetrics(platform: string, raw: Record<string, unknown>) {
  return {
    impressions: Number(raw.impressions ?? raw.reach_count ?? 0),
    reach: Number(raw.reach ?? raw.unique_impressions ?? 0),
    clicks: Number(raw.clicks ?? raw.link_clicks ?? raw.tap_forward ?? 0),
    reactions: Number(raw.reactions ?? raw.likes ?? raw.like_count ?? 0),
    comments: Number(raw.comments ?? raw.comment_count ?? 0),
    shares: Number(raw.shares ?? raw.share_count ?? raw.reposts ?? 0),
    saves: Number(raw.saves ?? raw.saved ?? 0),
    leads: Number(raw.leads ?? 0),
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { accountId, platform, posts } = body

    if (!accountId || !platform || !Array.isArray(posts)) {
      return NextResponse.json({ error: 'accountId, platform, and posts[] are required' }, { status: 400 })
    }

    const results = []
    const metricOps = []
    for (const p of posts) {
      const post = await prisma.socialPost.upsert({
        where: { id: p.id ?? '__new__' },
        create: {
          platform,
          accountId,
          externalPostId: p.externalPostId ?? null,
          status: p.status ?? 'published',
          caption: p.caption ?? '',
          mediaUrls: p.mediaUrls ?? null,
          publishedAt: p.publishedAt ? new Date(p.publishedAt) : null,
        },
        update: {
          status: p.status ?? 'published',
          caption: p.caption ?? '',
          publishedAt: p.publishedAt ? new Date(p.publishedAt) : null,
        },
      })

      if (p.metrics) {
        const normalized = normalizeMetrics(platform, p.metrics)
        // One snapshot per post per UTC day
        const base = p.metricDate ? new Date(p.metricDate) : new Date()
        const metricDate = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()))
        metricOps.push(
          prisma.socialMetric.upsert({
            where: { postId_metricDate: { postId: post.id, metricDate } },
            create: { postId: post.id, platform, metricDate, ...normalized, raw: p.metrics },
            update: { ...normalized, raw: p.metrics },
          })
        )
      }

      results.push(post.id)
    }

    if (metricOps.length > 0) await prisma.$transaction(metricOps)

    return NextResponse.json({ ok: true, ingested: results.length })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Ingest failed' }, { status: 500 })
  }
}
