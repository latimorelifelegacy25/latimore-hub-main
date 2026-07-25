'use client'

import { useEffect, useRef } from 'react'
import { getEventContext } from '@/lib/lead'

interface ArticleAnalyticsProps {
  slug: string
  title: string
  category: string
  author: string
  readingTime: string
}


function pushEvent(event: Record<string, unknown>) {
  try {
    const analyticsWindow = window as Window & { dataLayer?: Record<string, unknown>[] }
    analyticsWindow.dataLayer = analyticsWindow.dataLayer || []
    analyticsWindow.dataLayer.push(event)
  } catch {
    // analytics failures are silently swallowed
  }
}

function firePostViewed(input: {
  slug: string
  title: string
  category: string
  depth: 'entry' | '50pct' | '95pct'
}) {
  const ctx = getEventContext({ pageUrl: `/blog/${input.slug}` })
  fetch('/api/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventType: 'post_viewed',
      leadSessionId: ctx.leadSessionId,
      pageUrl: ctx.pageUrl,
      referrer: ctx.referrer,
      source: ctx.source,
      medium: ctx.medium,
      campaign: ctx.campaign,
      term: ctx.term,
      content: ctx.content,
      // /api/event ingests utm term/content from metadata only — the Event
      // model has no columns for them, so persist them here.
      metadata: {
        slug: input.slug,
        title: input.title,
        category: input.category,
        depth: input.depth,
        term: ctx.term ?? null,
        content: ctx.content ?? null,
      },
    }),
    keepalive: true,
    cache: 'no-store',
  }).catch(() => undefined)
}

export default function ArticleAnalytics({
  slug,
  title,
  category,
  author,
  readingTime,
}: ArticleAnalyticsProps) {
  const firedRef = useRef<Set<number>>(new Set())
  const fired50 = useRef(false)
  const fired95 = useRef(false)

  useEffect(() => {
    pushEvent({
      event: 'article_view',
      article_slug: slug,
      article_title: title,
      article_category: category,
      article_author: author,
      reading_time: readingTime,
    })
    firePostViewed({ slug, title, category, depth: 'entry' })
  }, [slug, title, category, author, readingTime])

  useEffect(() => {
    const thresholds = [25, 50, 75, 100]

    function onScroll() {
      const el = document.documentElement
      const scrollTop = el.scrollTop || document.body.scrollTop
      const scrollHeight = el.scrollHeight - el.clientHeight
      if (scrollHeight <= 0) return
      const pct = Math.round((scrollTop / scrollHeight) * 100)

      for (const threshold of thresholds) {
        if (pct >= threshold && !firedRef.current.has(threshold)) {
          firedRef.current.add(threshold)
          pushEvent({
            event: threshold === 100 ? 'article_complete' : 'scroll_depth',
            article_slug: slug,
            article_title: title,
            article_category: category,
            percent_scrolled: threshold,
          })
        }
      }

      if (!fired50.current && pct >= 50) {
        fired50.current = true
        firePostViewed({ slug, title, category, depth: '50pct' })
      }
      if (!fired95.current && pct >= 95) {
        fired95.current = true
        firePostViewed({ slug, title, category, depth: '95pct' })
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [slug, title, category])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest('a[data-cta]')
      if (!target) return
      pushEvent({
        event: 'cta_click',
        cta_name: (target as HTMLElement).dataset.cta,
        article_slug: slug,
        article_title: title,
        article_category: category,
      })
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [slug, title, category])

  return null
}
