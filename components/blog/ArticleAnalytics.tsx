'use client'

import { useEffect, useRef } from 'react'
import { sendGTMEvent } from '@next/third-parties/google'

interface ArticleAnalyticsProps {
  slug: string
  title: string
  track: string
  num: string
}

/**
 * Fires article analytics events via:
 *  - GTM (sendGTMEvent) for tag-manager-level tracking
 *  - /api/event for the Hub's internal analytics pipeline
 *
 * Events fired:
 *   article_view     — on mount
 *   article_read_50  — when reader scrolls past 50% of article
 *   article_read_100 — when reader reaches 95%+ of article
 */
export default function ArticleAnalytics({ slug, title, track, num }: ArticleAnalyticsProps) {
  const fired50 = useRef(false)
  const fired100 = useRef(false)

  const fire = (eventName: string) => {
    // GTM layer
    sendGTMEvent({
      event: eventName,
      article_slug: slug,
      article_title: title,
      article_track: track,
      article_num: num,
    })

    // Internal Hub analytics pipeline — failures silently swallowed
    fetch('/api/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: eventName,
        page: `/blog/${slug}`,
        metadata: { title, track, num },
      }),
      keepalive: true,
    }).catch(() => undefined)
  }

  useEffect(() => {
    fire('article_view')

    const handleScroll = () => {
      const doc = document.documentElement
      const total = doc.scrollHeight - doc.clientHeight
      if (total <= 0) return
      const pct = doc.scrollTop / total

      if (!fired50.current && pct >= 0.5) {
        fired50.current = true
        fire('article_read_50')
      }
      if (!fired100.current && pct >= 0.95) {
        fired100.current = true
        fire('article_read_100')
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  return null
}
