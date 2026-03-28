'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Eye, MousePointerClick, Link2 } from 'lucide-react'

type ClickStat = { label: string | null; _count: { label: number } }
type CardEventRow = {
  id: string
  event: string
  label: string | null
  referrer: string | null
  timestamp: string
}
type DayStat = { day: string; count: number }

type AnalyticsData = {
  totalVisits: number
  totalClicks: number
  clicks: ClickStat[]
  recent: CardEventRow[]
  visitsByDay: DayStat[]
}

const navy = '#0E1A2B'
const gold = '#C9A24D'
const lightGold = 'rgba(201,162,77,0.12)'

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e8e8e8',
      borderTop: `3px solid ${gold}`,
      borderRadius: 12,
      padding: '1.5rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    }}>
      <p style={{ color: '#999', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.5rem' }}>
        {icon} {label}
      </p>
      <p style={{ color: navy, fontSize: '2.25rem', fontWeight: 700, margin: 0, lineHeight: 1 }}>
        {value.toLocaleString()}
      </p>
    </div>
  )
}

function getReferrerHost(ref: string | null): string {
  if (!ref) return 'Direct'
  try { return new URL(ref).hostname } catch { return ref }
}

function MiniBarChart({ data }: { data: DayStat[] }) {
  if (!data.length) return <p style={{ color: '#bbb', fontSize: '0.9rem' }}>No data yet.</p>
  const max = Math.max(...data.map(d => d.count), 1)

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80, overflowX: 'auto' }}>
      {data.map((d) => (
        <div key={d.day} title={`${d.day}: ${d.count} visits`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '0 0 auto' }}>
          <div style={{
            width: 18,
            height: `${Math.max((d.count / max) * 72, 4)}px`,
            background: gold,
            borderRadius: '3px 3px 0 0',
            transition: 'height 0.3s',
          }} />
          <span style={{ fontSize: '0.6rem', color: '#bbb', marginTop: 2, whiteSpace: 'nowrap' }}>
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
    fetch('/api/card-events')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }

  useEffect(() => {
    const run = async () => {
      await refresh()
    }
    void run()
  }, [])

  const s: React.CSSProperties = { fontFamily: 'system-ui, sans-serif', padding: '2rem', maxWidth: 1100, margin: '0 auto' }

  if (loading) {
    return (
      <div style={{ ...s, textAlign: 'center', color: '#888', padding: '4rem 2rem 2rem' }}>
        Loading analytics…
      </div>
    )
  }
  
  if (error || !data) {
    return (
      <div style={{ ...s, textAlign: 'center', color: '#c0392b', padding: '4rem 2rem 2rem' }}>
        Failed to load. Check database connection.
      </div>
    )
  }

  
  const conversionRate = data.totalVisits > 0
    ? ((data.clicks.find(c => c.label === 'Book' || c.label === 'Free Legacy Strategy Review')?._count.label ?? 0) / data.totalVisits * 100).toFixed(1)
    : '0.0'

  return (
    <div style={s}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ color: navy, fontSize: '1.6rem', fontWeight: 700, margin: '0 0 0.25rem' }}>
            Digital Card Analytics
          </h1>
          <p style={{ color: '#888', margin: 0, fontSize: '0.9rem' }}>
            legacylandingpage.vercel.app — live tracking
          </p>
        </div>
        <button
          onClick={refresh}
          style={{
            background: navy, color: '#fff', border: 'none', borderRadius: 8,
            padding: '0.5rem 1.25rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem'
          }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard icon={<Eye size={22} />} label="Total Visits" value={data.totalVisits} />
        <StatCard icon={<MousePointerClick size={22} />} label="Total Clicks" value={data.totalClicks} />
        <StatCard icon={<Link2 size={22} />} label="Actions Tracked" value={data.clicks.length} />
        <div style={{
          background: '#fff',
          border: '1px solid #e8e8e8',
          borderTop: `3px solid ${gold}`,
          borderRadius: 12,
          padding: '1.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}>
          <p style={{ color: '#999', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.5rem' }}>
            Booking CVR
          </p>
          <p style={{ color: navy, fontSize: '2.25rem', fontWeight: 700, margin: 0, lineHeight: 1 }}>
            {conversionRate}%
          </p>
        </div>
      </div>

      {/* Two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

        {/* Visits Over Time */}
        <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 12, padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h2 style={{ color: navy, fontSize: '1rem', fontWeight: 700, margin: '0 0 1.25rem' }}>
            Visits — Last 30 Days
          </h2>
          <MiniBarChart data={data.visitsByDay} />
        </div>

        {/* Clicks by Button */}
        <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 12, padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h2 style={{ color: navy, fontSize: '1rem', fontWeight: 700, margin: '0 0 1.25rem' }}>
            Clicks by Button
          </h2>
          {data.clicks.length === 0 ? (
            <p style={{ color: '#bbb', fontSize: '0.9rem' }}>No clicks recorded yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {data.clicks.map((c, i) => {
                const pct = data.totalClicks > 0 ? Math.round((c._count.label / data.totalClicks) * 100) : 0
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                      <span style={{ color: navy, fontWeight: 600, fontSize: '0.88rem' }}>{c.label ?? '(unknown)'}</span>
                      <span style={{ color: '#888', fontSize: '0.85rem' }}>{c._count.label} ({pct}%)</span>
                    </div>
                    <div style={{ background: '#f0f0f0', borderRadius: 4, height: 7 }}>
                      <div style={{ background: gold, width: `${pct}%`, height: '100%', borderRadius: 4, transition: 'width 0.5s' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Table */}
      <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 12, padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <h2 style={{ color: navy, fontSize: '1rem', fontWeight: 700, margin: '0 0 1.25rem' }}>Recent Activity</h2>
        {data.recent.length === 0 ? (
          <p style={{ color: '#bbb', fontSize: '0.9rem' }}>No activity yet — deploy the card update to start tracking.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                  {['Time', 'Event', 'Label / Action', 'Referrer'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '0.4rem 0.75rem', color: '#aaa', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.recent.map((e) => (
                  <tr key={e.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '0.55rem 0.75rem', color: '#888', whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                      {new Date(e.timestamp).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.55rem 0.75rem' }}>
                      <span style={{
                        background: e.event === 'visit' ? 'rgba(14,26,43,0.08)' : lightGold,
                        color: e.event === 'visit' ? navy : '#8a6a1f',
                        padding: '0.2rem 0.65rem',
                        borderRadius: 5,
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}>
                        {e.event}
                      </span>
                    </td>
                    <td style={{ padding: '0.55rem 0.75rem', color: navy, fontWeight: 500 }}>{e.label ?? '—'}</td>
                    <td style={{ padding: '0.55rem 0.75rem', color: '#aaa', fontSize: '0.82rem' }}>
                      {getReferrerHost(e.referrer)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
