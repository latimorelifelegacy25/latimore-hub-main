'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Send } from 'lucide-react'
import PageHeader from '@/app/admin/_components/PageHeader'
import AdminCard from '@/app/admin/_components/AdminCard'
import EmptyState from '@/app/admin/_components/EmptyState'
import StatPill from '@/app/admin/_components/StatPill'
import type { MarketingContentItem } from '@/app/admin/marketing/_types'
import PublishButton from './PublishButton'

export default function PublisherClient() {
  const [data, setData] = useState<MarketingContentItem[]>([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const loadRepository = useCallback(async () => {
    setError('')

    try {
      const res = await fetch('/api/marketing/repository')
      const payload = await res.json()

      if (!res.ok) {
        throw new Error(payload?.error ?? 'Failed to load publisher')
      }

      setData(payload)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load publisher')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRepository()
  }, [loadRepository])

  const publishableItems = useMemo(() => data.filter((item) => item.status !== 'published'), [data])

  return (
    <div className="p-6 md:p-8">
      <PageHeader
        eyebrow="Marketing OS"
        title="Publisher"
        description="Review saved marketing content and publish draft, review, or scheduled items."
      />

      <AdminCard title="Ready to publish">
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        {isLoading ? <p className="text-sm text-[#A9B1BE]">Loading publisher…</p> : null}
        {!isLoading && !error && publishableItems.length === 0 ? (
          <EmptyState
            title="Nothing waiting to publish"
            description="Draft new content in the composer or review already published repository items."
            icon={<Send size={18} />}
          />
        ) : null}

        {!isLoading && !error && publishableItems.length > 0 ? (
          <div className="space-y-4">
            {publishableItems.map((item) => (
              <article key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{item.title}</h2>
                    <p className="mt-1 text-xs text-[#A9B1BE]">
                      {item.type} · {item.status} · {item.campaign ?? 'no campaign'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatPill label="Destination" value={item.destination ?? '—'} />
                    <StatPill label="UTM" value={item.utmSource ?? '—'} />
                  </div>
                </div>
                <PublishButton id={item.id} onPublish={loadRepository} />
              </article>
            ))}
          </div>
        ) : null}
      </AdminCard>
    </div>
  )
}
