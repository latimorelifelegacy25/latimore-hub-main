'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    fbq?: (...args: any[]) => void
  }
}

const META_PIXEL_ID = '988841003848131'

const allowedDomains = [
  'latimorelifelegacy.com',
  'www.latimorelifelegacy.com',
]

export default function MetaViewContentTracker() {
  useEffect(() => {
    const hostname = window.location.hostname

    // Prevent Meta pollution from Vercel preview URLs
    if (!allowedDomains.includes(hostname)) return

    const eventId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? `viewcontent_${Date.now()}_${crypto.randomUUID()}`
        : `viewcontent_${Date.now()}_${Math.random().toString(36).slice(2)}`

    if (window.fbq) {
      window.fbq(
        'track',
        'ViewContent',
        {
          content_name: 'Latimore Life & Legacy',
          content_category: 'Insurance Education',
        },
        {
          eventID: eventId,
        }
      )
    }

    fetch('/api/meta/view-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      keepalive: true,
      body: JSON.stringify({
        eventId,
        eventSourceUrl: window.location.href,
        contentName: 'Latimore Life & Legacy',
        contentCategory: 'Insurance Education',
      }),
    }).catch(() => {})
  }, [])

  return null
}
