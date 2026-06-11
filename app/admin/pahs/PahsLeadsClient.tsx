'use client'

import { Fragment, useMemo, useState } from 'react'
import { Download, Phone, Mail, Trophy } from 'lucide-react'
import PageHeader from '../_components/PageHeader'
import AdminCard from '../_components/AdminCard'
import EmptyState from '../_components/EmptyState'

export type PahsLead = {
  id: string
  fullName: string
  phone: string
  email: string
  county: string
  coverageInterest: string
  bestTime: string
  source: string
  medium: string
  campaign: string
  landingPage: string
  stage: string
  createdAt: string
}

type SortKey = 'createdAt' | 'fullName' | 'coverageInterest' | 'bestTime' | 'source'
type SortDir = 'asc' | 'desc'

const COVERAGE_COLORS: Record<string, string> = {
  "Protect my family's income": 'bg-blue-500/20 text-blue-300',
  'Pay off my home if something happens': 'bg-emerald-500/20 text-emerald-300',
  'Plan for retirement': 'bg-purple-500/20 text-purple-300',
  "Protect my kids' future": 'bg-pink-500/20 text-pink-300',
  'Not sure — show me my options': 'bg-gray-500/20 text-gray-300',
}

const COVERAGE_ICONS: Record<string, string> = {
  "Protect my family's income": '🛡️',
  'Pay off my home if something happens': '🏠',
  'Plan for retirement': '📈',
  "Protect my kids' future": '👶',
  'Not sure — show me my options': '💡',
}

function exportCSV(data: PahsLead[], filename: string) {
  if (!data.length) return
  const headers = Object.keys(data[0]) as Array<keyof PahsLead>
  const rows = data.map((row) =>
    headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')
  )
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function BarRow({ label, count, total, icon }: { label: string; count: number; total: number; icon?: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-3 py-2">
      {icon ? <div className="w-5 flex-shrink-0 text-center">{icon}</div> : null}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between">
          <p className="truncate pr-2 text-sm text-[#D7DCE5]">{label}</p>
          <span className="flex-shrink-0 text-sm font-semibold text-white">{count}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
          <div className="h-full rounded-full bg-[#C9A25F] transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <span className="w-8 flex-shrink-0 text-right text-xs text-[#A9B1BE]">{pct}%</span>
    </div>
  )
}

export default function PahsLeadsClient({ leads }: { leads: PahsLead[] }) {
  const [search, setSearch] = useState('')
  const [filterCoverage, setFilterCoverage] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('createdAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const stats = useMemo(() => {
    const total = leads.length

    const coverageMap: Record<string, number> = {}
    const sourceMap: Record<string, number> = {}
    const timeMap: Record<string, number> = {}
    const countyMap: Record<string, number> = {}

    leads.forEach((l) => {
      const coverage = l.coverageInterest || 'Not specified'
      coverageMap[coverage] = (coverageMap[coverage] ?? 0) + 1

      const source = l.medium || l.source || 'direct'
      sourceMap[source] = (sourceMap[source] ?? 0) + 1

      const time = l.bestTime || 'Not specified'
      timeMap[time] = (timeMap[time] ?? 0) + 1

      if (l.county) countyMap[l.county] = (countyMap[l.county] ?? 0) + 1
    })

    // eslint-disable-next-line react-hooks/purity -- "today" is a stable reference point for the leads snapshot, not used for rendering time
    const now = Date.now()
    const today = new Date(now).toDateString()
    const todayCount = leads.filter((l) => new Date(l.createdAt).toDateString() === today).length
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)
    const weekCount = leads.filter((l) => new Date(l.createdAt) >= weekAgo).length

    return {
      total,
      todayCount,
      weekCount,
      coverageBreakdown: Object.entries(coverageMap).sort((a, b) => b[1] - a[1]),
      sourceBreakdown: Object.entries(sourceMap).sort((a, b) => b[1] - a[1]),
      timeBreakdown: Object.entries(timeMap).sort((a, b) => b[1] - a[1]),
      countyBreakdown: Object.entries(countyMap).sort((a, b) => b[1] - a[1]).slice(0, 8),
    }
  }, [leads])

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (filterCoverage && l.coverageInterest !== filterCoverage) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !l.fullName.toLowerCase().includes(q) &&
          !l.email.toLowerCase().includes(q) &&
          !l.phone.toLowerCase().includes(q) &&
          !l.county.toLowerCase().includes(q)
        ) {
          return false
        }
      }
      return true
    })
  }, [leads, search, filterCoverage])

  const sortedLeads = useMemo(() => {
    return [...filteredLeads].sort((a, b) => {
      const av = a[sortKey] ?? ''
      const bv = b[sortKey] ?? ''
      const cmp = String(av).localeCompare(String(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filteredLeads, sortKey, sortDir])

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const hasFilters = Boolean(search || filterCoverage)

  const TABLE_COLS: Array<{ key: SortKey; label: string }> = [
    { key: 'createdAt', label: 'Date' },
    { key: 'fullName', label: 'Name' },
    { key: 'coverageInterest', label: 'Coverage' },
    { key: 'bestTime', label: 'Best Time' },
    { key: 'source', label: 'Source' },
  ]

  return (
    <div className="p-6 md:p-8">
      <PageHeader
        eyebrow="PAHS Campaign"
        title="PAHS Leads"
        description="Leads captured from the Protect What You Play For (PAHS) landing pages and QR campaign."
        actions={
          <button
            onClick={() => exportCSV(sortedLeads, `pahs-leads-${new Date().toISOString().split('T')[0]}.csv`)}
            disabled={!sortedLeads.length}
            className="inline-flex items-center gap-2 rounded-lg border border-[#C9A25F]/40 px-4 py-2 text-sm font-medium text-[#C9A25F] transition-colors hover:bg-[#C9A25F]/10 disabled:opacity-50"
          >
            <Download size={14} />
            Export {sortedLeads.length} Leads
          </button>
        }
      />

      {leads.length === 0 ? (
        <EmptyState
          title="No PAHS leads yet"
          description="QR scans and form submissions from the PAHS landing pages will appear here automatically."
          icon={<Trophy size={18} />}
        />
      ) : (
        <div className="space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <AdminCard><p className="text-sm text-[#A9B1BE]">Total Leads</p><p className="mt-1 text-3xl font-bold text-white">{stats.total}</p></AdminCard>
            <AdminCard><p className="text-sm text-[#A9B1BE]">Today</p><p className="mt-1 text-3xl font-bold text-white">{stats.todayCount}</p></AdminCard>
            <AdminCard><p className="text-sm text-[#A9B1BE]">This Week</p><p className="mt-1 text-3xl font-bold text-white">{stats.weekCount}</p></AdminCard>
            <AdminCard>
              <p className="text-sm text-[#A9B1BE]">Top Coverage</p>
              <p className="mt-1 truncate text-lg font-bold text-white">{stats.coverageBreakdown[0]?.[0] ?? '—'}</p>
              <p className="mt-1 text-xs text-[#A9B1BE]">{stats.coverageBreakdown[0] ? `${stats.coverageBreakdown[0][1]} leads` : ''}</p>
            </AdminCard>
          </div>

          {/* Breakdown grid */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <AdminCard title="Coverage Interest">
              {stats.coverageBreakdown.length === 0 ? (
                <p className="text-sm text-[#A9B1BE]">No data yet</p>
              ) : (
                <div className="divide-y divide-white/5">
                  {stats.coverageBreakdown.map(([interest, count]) => (
                    <BarRow key={interest} label={interest} count={count} total={stats.total} icon={COVERAGE_ICONS[interest] ?? '📋'} />
                  ))}
                </div>
              )}
            </AdminCard>

            <AdminCard title="Source / Medium">
              {stats.sourceBreakdown.length === 0 ? (
                <p className="text-sm text-[#A9B1BE]">No data yet</p>
              ) : (
                <div className="divide-y divide-white/5">
                  {stats.sourceBreakdown.map(([source, count]) => (
                    <BarRow key={source} label={source} count={count} total={stats.total} icon={source === 'qr' ? '📱' : '🔗'} />
                  ))}
                </div>
              )}
              <div className="mt-4 border-t border-white/5 pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#A9B1BE]">Best Time to Call</p>
                {stats.timeBreakdown.map(([time, count]) => (
                  <div key={time} className="flex items-center justify-between py-1">
                    <span className="text-sm text-[#A9B1BE]">{time}</span>
                    <span className="text-sm font-semibold text-white">{count}</span>
                  </div>
                ))}
              </div>
            </AdminCard>

            <AdminCard title="Top Counties">
              {stats.countyBreakdown.length === 0 ? (
                <p className="text-sm text-[#A9B1BE]">No data yet</p>
              ) : (
                <div className="space-y-2">
                  {stats.countyBreakdown.map(([county, count], i) => (
                    <div key={county} className="flex items-center gap-3">
                      <span className="w-4 text-xs text-[#6B7280]">{i + 1}</span>
                      <div className="flex-1">
                        <div className="mb-0.5 flex items-center justify-between">
                          <span className="font-mono text-sm text-white">{county}</span>
                          <span className="text-xs text-[#A9B1BE]">{count} lead{count !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="h-1 overflow-hidden rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full bg-[#C9A25F]"
                            style={{ width: `${Math.round((count / (stats.countyBreakdown[0]?.[1] ?? 1)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </AdminCard>
          </div>

          {/* Filters */}
          <AdminCard>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, phone, or county…"
                className="flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-[#6B7280] focus:border-[#C9A25F]/50 focus:outline-none"
              />
              <select
                value={filterCoverage}
                onChange={(e) => setFilterCoverage(e.target.value)}
                className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white focus:border-[#C9A25F]/50 focus:outline-none"
              >
                <option value="">All coverage types</option>
                {stats.coverageBreakdown.map(([interest]) => (
                  <option key={interest} value={interest}>{interest}</option>
                ))}
              </select>
              {hasFilters && (
                <button
                  onClick={() => { setSearch(''); setFilterCoverage('') }}
                  className="text-sm text-[#A9B1BE] transition-colors hover:text-red-400"
                >
                  Clear filters
                </button>
              )}
            </div>
          </AdminCard>

          {/* Leads table */}
          <div>
            <p className="mb-3 text-sm text-[#A9B1BE]">
              Showing <span className="font-medium text-white">{sortedLeads.length}</span> of {leads.length} leads
              {hasFilters && ' (filtered)'}
            </p>
            <div className="overflow-x-auto rounded-2xl border border-white/8">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8 bg-white/[0.02] text-left text-xs uppercase tracking-[0.18em] text-[#8F98A8]">
                    {TABLE_COLS.map((col) => (
                      <th key={col.key} onClick={() => handleSort(col.key)} className="cursor-pointer whitespace-nowrap px-4 py-3 transition-colors hover:text-[#C9A25F]">
                        {col.label}
                        {sortKey === col.key && (sortDir === 'asc' ? ' ▲' : ' ▼')}
                      </th>
                    ))}
                    <th className="w-8 px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {sortedLeads.map((lead) => (
                    <Fragment key={lead.id}>
                      <tr
                        key={lead.id}
                        onClick={() => setExpandedRow(expandedRow === lead.id ? null : lead.id)}
                        className="cursor-pointer border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.03]"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-[#A9B1BE]">
                          {new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-white">{lead.fullName}</td>
                        <td className="px-4 py-3">
                          <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${COVERAGE_COLORS[lead.coverageInterest] ?? 'bg-gray-500/20 text-gray-300'}`}>
                            {COVERAGE_ICONS[lead.coverageInterest] ?? '📋'} {lead.coverageInterest}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-[#A9B1BE]">{lead.bestTime || '—'}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs font-medium text-[#A9B1BE]">
                            {lead.medium || lead.source || 'direct'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#6B7280]">{expandedRow === lead.id ? '▲' : '▼'}</td>
                      </tr>
                      {expandedRow === lead.id && (
                        <tr key={`${lead.id}-exp`} className="border-b border-white/5 bg-white/[0.02]">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                              {[
                                { label: 'Full Name', value: lead.fullName },
                                { label: 'Phone', value: lead.phone || '—' },
                                { label: 'Email', value: lead.email || '—' },
                                { label: 'County', value: lead.county || '—' },
                                { label: 'Coverage', value: lead.coverageInterest },
                                { label: 'Best Time', value: lead.bestTime || '—' },
                                { label: 'Source', value: lead.source || '—' },
                                { label: 'Medium', value: lead.medium || '—' },
                                { label: 'Campaign', value: lead.campaign || '—' },
                                { label: 'Stage', value: lead.stage.replace(/_/g, ' ') },
                                { label: 'Landing Page', value: lead.landingPage || '—' },
                                { label: 'Submitted', value: new Date(lead.createdAt).toLocaleString() },
                              ].map(({ label, value }) => (
                                <div key={label}>
                                  <p className="mb-0.5 text-xs uppercase tracking-wider text-[#C9A25F]">{label}</p>
                                  <p className="break-all text-sm text-[#D7DCE5]">{value}</p>
                                </div>
                              ))}
                            </div>
                            <div className="mt-4 flex gap-3">
                              {lead.phone && (
                                <a href={`tel:${lead.phone}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1.5 rounded-lg bg-[#C9A25F]/15 px-3 py-1.5 text-xs font-semibold text-[#C9A25F] transition-colors hover:bg-[#C9A25F]/25">
                                  <Phone size={12} /> Call {lead.fullName.split(' ')[0]}
                                </a>
                              )}
                              {lead.email && (
                                <a href={`mailto:${lead.email}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#D7DCE5] transition-colors hover:text-[#C9A25F]">
                                  <Mail size={12} /> Email
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
