export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminSession } from '@/lib/ai/shared'

const CLICK_EVENT_TYPES = ['cta_click', 'call_click', 'text_click', 'email_click', 'book_click']
const DAY_COUNT = 14

type LinkAggregate = {
  slug: string
  title: string | null
  visits: number
  clicks: number
  lastVisitedAt: string | null
}

function metadataString(metadata: unknown, key: string): string | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null
  const value = (metadata as Record<string, unknown>)[key]
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function normalizeSlug(value: string | null | undefined): string {
  const fallback = 'digital-card'
  if (!value || !value.trim()) return fallback

  try {
    const parsed = new URL(value, 'https://example.com')
    const path = parsed.pathname.split('/').filter(Boolean).join('/')
    return path || fallback
  } catch {
    return value.trim().toLowerCase().split('/').filter(Boolean).join('/') || fallback
  }
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function isoDay(date: Date) {
  return date.toISOString().slice(0, 10)
}

export async function GET() {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  try {
    const now = new Date()
    const firstDay = startOfDay(new Date(now))
    firstDay.setDate(firstDay.getDate() - (DAY_COUNT - 1))

    const [visits, clicks, allEvents, recentEvents] = await Promise.all([
      prisma.event.count({
        where: {
          source: 'digital_card',
          eventType: 'page_view',
        },
      }),
      prisma.event.count({
        where: {
          source: 'digital_card',
          eventType: { in: CLICK_EVENT_TYPES as any },
        },
      }),
      prisma.event.findMany({
        where: { source: 'digital_card' },
        orderBy: { occurredAt: 'desc' },
        take: 5000,
        select: {
          eventType: true,
          pageUrl: true,
          occurredAt: true,
          metadata: true,
        },
      }),
      prisma.event.findMany({
        where: {
          source: 'digital_card',
          occurredAt: { gte: firstDay },
        },
        orderBy: { occurredAt: 'asc' },
        select: {
          eventType: true,
          occurredAt: true,
        },
      }),
    ])

    const dailyMap = new Map<string, number>()
    for (let i = 0; i < DAY_COUNT; i += 1) {
      const day = startOfDay(new Date(firstDay))
      day.setDate(firstDay.getDate() + i)
      dailyMap.set(isoDay(day), 0)
    }

    for (const event of recentEvents) {
      if (event.eventType !== 'page_view') continue
      const key = isoDay(event.occurredAt)
      dailyMap.set(key, (dailyMap.get(key) ?? 0) + 1)
    }

    const linkMap = new Map<string, LinkAggregate>()
    for (const event of allEvents) {
      const slug = normalizeSlug(
        metadataString(event.metadata, 'slug') ??
        metadataString(event.metadata, 'destination') ??
        metadataString(event.metadata, 'label') ??
        event.pageUrl,
      )
      const title = metadataString(event.metadata, 'title') ?? metadataString(event.metadata, 'label') ?? slug
      const current = linkMap.get(slug) ?? {
        slug,
        title,
        visits: 0,
        clicks: 0,
        lastVisitedAt: null,
      }

      if (event.eventType === 'page_view') current.visits += 1
      if (CLICK_EVENT_TYPES.includes(String(event.eventType))) current.clicks += 1

      const occurredAt = event.occurredAt.toISOString()
      if (!current.lastVisitedAt || occurredAt > current.lastVisitedAt) {
        current.lastVisitedAt = occurredAt
      }

      linkMap.set(slug, current)
    }

    return NextResponse.json({
      totals: {
        visits,
        clicks,
        links: linkMap.size,
      },
      daily: Array.from(dailyMap, ([day, count]) => ({ day, count })),
      links: Array.from(linkMap.values())
        .sort((a, b) => (b.visits + b.clicks) - (a.visits + a.clicks))
        .slice(0, 25),
    })
  } catch (error) {
    console.error('[admin/card-analytics] failed', error)
    return NextResponse.json({ ok: false, error: 'Unable to load card analytics' }, { status: 500 })
  }
}
