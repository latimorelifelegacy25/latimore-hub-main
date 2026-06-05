'use client'

import { useEffect, useState } from 'react'
import { Eye, MousePointerClick, Link2 } from 'lucide-react'

import PageHeader from '@/app/admin/_components/PageHeader'
import AdminCard from '@/app/admin/_components/AdminCard'
import StatPill from '@/app/admin/_components/StatPill'
import EmptyState from '@/app/admin/_components/EmptyState'

type DayStat = { day: string; count: number }
type LinkStat = { slug: string; title?: string | null; visits: number; clicks: number; lastVisitedAt?: string | null }
type AnalyticsData = {
  totals: { visits: number; clicks: number; links: number }
  daily: DayStat[]
  links: LinkStat[]
}

const gold = '#C9A25F'

function MiniBarChart({ data }: { data: DayStat[] }) {
  if (!data.length) {
    return <EmptyState title="No daily activity yet" description="Share your digital card link to start collecting visit and click data." />
  }

  const max = Math.max(...data.map(d => d.count), 1)

  return (
    <div className="flex items-end gap-1 h-24 overflow-x-auto">
      {data.map((d) => (
        <div key={d.day} className="flex flex-col items-center">
          <div
            className="w-3 rounded-t-md transition-all"
            style={{
              height: `${Math.max((d.count / max) * 80, 4)}px`,
              background: gold,
            }}
          />
          <span className="text-[10px] text-[#A9B1BE] mt-1 whitespace-nowrap">
            {d.day.slice(5)}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function CardAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const refresh = () => {
    setLoading(true)
    setError(false)
    fetch('/api/admin/card-analytics')
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text())
        return res.json()
      })
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    refresh()
  }, [])

  const totals = data?.totals ?? { visits: 0, clicks: 0, links: 0 }

  return (
    <div className="p-6 md:p-8">
      <PageHeader
        eyebrow="Digital Card Analytics"
        title="Card Performance"
        description="Track traffic and CTA clicks from your Latimore Life & Legacy digital business card links."
      />

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <StatPill label="Total visits" value={totals.visits} />
        <StatPill label="CTA clicks" value={totals.clicks} />
        <StatPill label="Tracked links" value={totals.links} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <AdminCard title="Last 14 days">
          {loading ? <p className="text-sm text-[#A9B1BE]">Loading…</p> : <MiniBarChart data={data?.daily ?? []} />}
        </AdminCard>

        <AdminCard title="Top links">
          {error ? (
            <EmptyState title="Unable to load analytics" description="Check the API route or database connection." />
          ) : loading ? (
            <p className="text-sm text-[#A9B1BE]">Loading…</p>
          ) : !data?.links.length ? (
            <EmptyState title="No links tracked yet" description="Create or share tracked card links to populate this table." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs uppercase tracking-[0.16em] text-[#A9B1BE]">
                    <th className="py-2 pr-4">Link</th>
                    <th className="py-2 pr-4">Visits</th>
                    <th className="py-2 pr-4">Clicks</th>
                    <th className="py-2">Last Visit</th>
                  </tr>
                </thead>
                <tbody>
                  {data.links.map((link) => (
                    <tr key={link.slug} className="border-b border-white/6 text-[#D7DCE5]">
                      <td className="py-3 pr-4">
                        <div className="font-semibold text-white">{link.title || link.slug}</div>
                        <div className="text-xs text-[#A9B1BE]">/{link.slug}</div>
                      </td>
                      <td className="py-3 pr-4">{link.visits}</td>
                      <td className="py-3 pr-4">{link.clicks}</td>
                      <td className="py-3 text-xs text-[#A9B1BE]">
                        {link.lastVisitedAt ? new Date(link.lastVisitedAt).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminCard>
      </div>
    </div>
  )
}
