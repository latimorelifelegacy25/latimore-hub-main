'use client'

import { useEffect } from 'react'

/** Marks this browser as internal once per session so the owner's own site visits aren't counted. */
export default function ExcludeFromAnalytics() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem('ll_internal_marked')) return
      sessionStorage.setItem('ll_internal_marked', '1')
    } catch {
      // Storage can be unavailable (private mode); marking again is harmless.
    }
    void fetch('/api/track/exclude', { headers: { accept: 'application/json' }, cache: 'no-store' }).catch(() => undefined)
  }, [])

  return null
}
