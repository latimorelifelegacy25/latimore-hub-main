export const dynamic = 'force-dynamic'

import { BarChart3 } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import PageHeader from '../_components/PageHeader'
import AdminCard from '../_components/AdminCard'
import EmptyState from '../_components/EmptyState'
import { countAll } from '@/lib/prisma-helpers'

export default async function AnalyticsPage() {
  const [sourceCounts, countyCounts, recentEvents, productCounts] = await Promise.all([
    prisma.inquiry.groupBy({
      by: ['source'],
      _count: { _all: true },
      where: { source: { not: null } },
      orderBy: {
        _count: {
          source: 'desc',
        },
      },
      take: 10,
    }),
    prisma.contact.groupBy({
      by: ['county'],
      _count: { _all: true },
      where: { county: { not: null } },
      orderBy: {
        _count: {
          county: 'desc',
        },
      },
      take: 10,
    }),
    prisma.systemEvent.findMany({
      take: 25,
      orderBy: { occurredAt: 'desc' },
    }),
    prisma.inquiry.groupBy({
      by: ['productInterest'],
      _count: { _all: true },
      orderBy: {
        _count: {
          productInterest: 'desc',
        },
      },
      take: 10,
    }),
  ])

  return (
    <div className="p-6 md:p-8">
      <PageHeader eyebrow="Analytics" title="Attribution & activity" description="Operational visibility into lead sources, county concentration, product demand, and recent system events." />
      <div className="grid gap-4 xl:grid-cols-2">
        <AdminCard title="Top sources">{sourceCounts.length === 0 ? <EmptyState title="No source attribution yet" /> : <div className="space-y-3">{sourceCounts.map((row) => <div key={row.source ?? 'unknown'} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4"><div className="mb-2 flex items-center justify-between"><p className="text-sm font-medium text-white">{row.source ?? 'Unknown source'}</p><p className="text-sm font-semibold text-[#C9A25F]">{countAll(row._count)}</p></div><div className="h-2 rounded-full bg-white/6"><div className="h-2 rounded-full bg-[#C9A25F]" style={{ width: `${Math.min(100, countAll(row._count) * 8)}%` }} /></div></div>)}</div>}</AdminCard>
        <AdminCard title="Top counties">{countyCounts.length === 0 ? <EmptyState title="No county data yet" /> : <div className="space-y-3">{countyCounts.map((row) => <div key={row.county ?? 'unknown'} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4"><div className="mb-2 flex items-center justify-between"><p className="text-sm font-medium text-white">{row.county ?? 'Unknown county'}</p><p className="text-sm font-semibold text-[#C9A25F]">{countAll(row._count)}</p></div><div className="h-2 rounded-full bg-white/6"><div className="h-2 rounded-full bg-[#C9A25F]" style={{ width: `${Math.min(100, countAll(row._count) * 8)}%` }} /></div></div>)}</div>}</AdminCard>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr,1.1fr]">
        <AdminCard title="Product demand">{productCounts.length === 0 ? <EmptyState title="No product demand data yet" /> : <div className="space-y-3">{productCounts.map((row) => <div key={row.productInterest} className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3"><p className="text-sm text-white">{row.productInterest}</p><p className="text-sm font-semibold text-[#C9A25F]">{countAll(row._count)}</p></div>)}</div>}</AdminCard>
        <AdminCard title="Recent system events">{recentEvents.length === 0 ? <EmptyState title="No system events yet" description="Business activity will appear here after event ingestion is connected." icon={<BarChart3 size={18} />} /> : <div className="space-y-3">{recentEvents.map((event) => <div key={event.id} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold text-white">{event.type}</p><p className="mt-1 text-xs text-[#A9B1BE]">{[event.source, event.medium, event.campaign].filter(Boolean).join(' · ') || 'No attribution'}</p></div><p className="text-xs text-[#8F98A8]">{new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(event.occurredAt)}</p></div></div>)}</div>}</AdminCard>
      </div>
    </div>
  )
}
