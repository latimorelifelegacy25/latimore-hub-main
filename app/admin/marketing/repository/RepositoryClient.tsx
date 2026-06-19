'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { FileText } from 'lucide-react'
import PageHeader from '@/app/admin/_components/PageHeader'
import AdminCard from '@/app/admin/_components/AdminCard'
import EmptyState from '@/app/admin/_components/EmptyState'
import StatPill from '@/app/admin/_components/StatPill'
import type { MarketingContentItem } from '@/app/admin/marketing/_types'
import RepositoryCard from './RepositoryCard'

export default function RepositoryClient() {
  const [data, setData] = useState<MarketingContentItem[]>([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadRepository() {
      try {
        const res = await fetch('/api/marketing/repository')
        const payload = await res.json()

        if (!res.ok) {
          throw new Error(payload?.error ?? 'Failed to load repository')
        }

        if (isMounted) setData(payload)
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err.message : 'Failed to load repository')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadRepository()

    return () => {
      isMounted = false
    }
  }, [])

  const statusCounts = useMemo(() => {
    return data.reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = (acc[item.status] ?? 0) + 1
      return acc
    }, {})
  }, [data])

  return (
    <div className="p-6 md:p-8">
      <PageHeader
        eyebrow="Marketing OS"
        title="Content Repository"
        description="Create, store, and manage campaign, social, email, and landing page content."
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {Object.entries(statusCounts).map(([status, count]) => (
            <StatPill key={status} label={status} value={count} />
          ))}
        </div>
        <Link href="/admin/marketing/composer" className="text-sm font-semibold text-blue-400 hover:underline">
          Create Content →
        </Link>
      </div>

      <AdminCard title="Repository">
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        {isLoading ? <p className="text-sm text-[#A9B1BE]">Loading repository…</p> : null}
        {!isLoading && !error && data.length === 0 ? (
          <EmptyState
            title="No content yet"
            description="Use the composer to create your first marketing draft."
            icon={<FileText size={18} />}
          />
        ) : null}

        {!isLoading && !error && data.length > 0 ? (
          <div className="space-y-4">
            {data.map((item) => (
              <RepositoryCard key={item.id} item={item} />
            ))}
          </div>
        ) : null}
      </AdminCard>
    </div>
  )
}
