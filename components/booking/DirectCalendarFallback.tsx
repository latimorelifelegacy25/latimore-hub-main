'use client'

import { useEffect, useState } from 'react'
import { BRAND } from '@/lib/brand'

type AvailabilityProbe = {
  ok?: boolean
  errorCode?: 'CALENDAR_DISCONNECTED' | 'CALENDAR_ERROR'
}

export default function DirectCalendarFallback() {
  const [showFallback, setShowFallback] = useState(false)

  useEffect(() => {
    let ignore = false

    async function probe() {
      try {
        const response = await fetch('/api/availability', { cache: 'no-store' })
        const data = (await response.json().catch(() => ({}))) as AvailabilityProbe
        if (!ignore) setShowFallback(!response.ok || data.ok === false)
      } catch {
        if (!ignore) setShowFallback(true)
      }
    }

    void probe()
    return () => {
      ignore = true
    }
  }, [])

  if (!showFallback) return null

  return (
    <div className="mx-auto max-w-6xl px-4 pt-5 sm:px-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E1B54B]/35 bg-[#E1B54B]/10 p-4 text-white shadow-lg sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#E1B54B]">Direct scheduling available</p>
          <p className="mt-1 text-sm leading-6 text-white/80">
            The embedded calendar connection needs attention, but you can still choose an available consultation time directly on the secure Google appointment page.
          </p>
        </div>
        <a
          href={BRAND.externalBookingUrl}
          target="_blank"
          rel="noreferrer"
          data-track="true"
          data-track-event="book_consultation_clicked"
          data-track-cta="true"
          className="shrink-0 rounded-xl bg-[#E1B54B] px-5 py-3 text-center text-sm font-black text-[#000835] transition hover:brightness-105"
        >
          Open Available Times
        </a>
      </div>
    </div>
  )
}
