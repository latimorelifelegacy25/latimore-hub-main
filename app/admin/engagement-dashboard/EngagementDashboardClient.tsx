'use client'

import { useEffect, useState, useCallback } from 'react'
import { ga4 } from '@/lib/analytics/ga4'

type Totals = {
  impressions: number
  reach: number
  clicks: number
  reactions: number
  comments: number
  shares: number
  saves: number
  leads: number
}

type TrendPoint = {
  date: string
  reactions: number
  comments: number
  shares: number
  clicks: number
}

type Insight = {
  id: string
  type: string
  severity: string
  title: string
  summary: string
  action?: string
  createdAt: string
}

type Post = {
  id: string
  platform: string
  caption: string
  publishedAt: string | null
  metrics: { reactions: number; comments: number; shares: number; clicks: number; reach: number }[]
}

type MetricsData = {
  totals: Totals
  byPlatform: Record<string, Totals>
  trend: TrendPoint[]
  insights: Insight[]
  recentPosts: Post[]
  days: number
}

const PLATFORM_COLORS: Record<string, string> = {
  facebook: '#1877F2',
  instagram: '#E1306C',
  linkedin: '#0A66C2',
  twitter: '#1DA1F2',
  website: '#C49A6C',
}

const SEVERITY_COLORS: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e',
  info: '#3b82f6',
}

function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(196,154,108,0.2)', borderRadius: 10, padding: '16px 20px' }}>
      <div style={{ fontSize: '0.72rem', color: '#C49A6C', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.5s' }} />
      </div>
      <span style={{ fontSize: '0.78rem', color: '#fff', minWidth: 36, textAlign: 'right' }}>{value.toLocaleString()}</span>
    </div>
  )
}

function TrendChart({ trend }: { trend: TrendPoint[] }) {
  if (!trend.length) return <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', textAlign: 'center', padding: '24px 0' }}>No trend data yet</div>
  const maxVal = Math.max(...trend.map(t => t.reactions + t.comments + t.shares + t.clicks), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80, padding: '0 4px' }}>
      {trend.slice(-21).map((t) => {
        const total = t.reactions + t.comments + t.shares + t.clicks
        const h = Math.max((total / maxVal) * 72, 2)
        return (
          <div key={t.date} title={`${t.date}: ${total} engagements`} style={{ flex: 1, height: h, background: 'linear-gradient(180deg,#C49A6C,#8B6530)', borderRadius: '2px 2px 0 0', cursor: 'default', transition: 'opacity 0.2s' }} />
        )
      })}
    </div>
  )
}

export default function EngagementDashboardClient() {
  const [data, setData] = useState<MetricsData | null>(null)
  const [days, setDays] = useState(30)
  const [platform, setPlatform] = useState('')
  const [loading, setLoading] = useState(true)
  const [sentimentText, setSentimentText] = useState('')
  const [sentimentResult, setSentimentResult] = useState<Record<string, unknown> | null>(null)
  const [sentimentLoading, setSentimentLoading] = useState(false)
  const [weeklyLoading, setWeeklyLoading] = useState(false)
  const [weeklyReport, setWeeklyReport] = useState<Record<string, unknown> | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'sentiment' | 'reports' | 'insights'>('overview')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ days: String(days) })
      if (platform) params.set('platform', platform)
      const res = await fetch(`/api/social/metrics?${params}`)
      const json = res.ok ? await res.json() : null
      setData(json)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [days, platform])

  useEffect(() => {
    load()
    ga4.dashboardView('engagement_intelligence')
  }, [load])

  async function runSentiment() {
    if (!sentimentText.trim()) return
    setSentimentLoading(true)
    setSentimentResult(null)
    try {
      const res = await fetch('/api/ai/sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sentimentText }),
      })
      const json = await res.json()
      setSentimentResult(json.result ?? null)
    } catch {
      setSentimentResult({ error: 'Analysis failed' })
    } finally {
      setSentimentLoading(false)
    }
  }

  async function runWeeklyReport() {
    setWeeklyLoading(true)
    setWeeklyReport(null)
    try {
      const res = await fetch('/api/reports/weekly', { method: 'POST' })
      const json = await res.json()
      setWeeklyReport(json.analysis ?? null)
      ga4.reportGenerated('weekly')
    } catch {
      setWeeklyReport({ error: 'Report failed' })
    } finally {
      setWeeklyLoading(false)
    }
  }

  const totals = data?.totals
  const engRate = totals && totals.reach > 0
    ? (((totals.reactions + totals.comments + totals.shares) / totals.reach) * 100).toFixed(1) + '%'
    : '—'

  const platforms = data ? Object.keys(data.byPlatform) : []
  const maxPlatformReach = platforms.length
    ? Math.max(...platforms.map(p => data!.byPlatform[p].reach), 1)
    : 1

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'insights', label: `Insights${data?.insights?.length ? ` (${data.insights.length})` : ''}` },
    { id: 'sentiment', label: 'Sentiment AI' },
    { id: 'reports', label: 'Weekly Report' },
  ] as const

  return (
    <div style={{ padding: '24px', maxWidth: 1100, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginBottom: 4 }}>Engagement Intelligence</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Cross-platform analytics, AI sentiment, and weekly reports</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select
            value={days}
            onChange={e => setDays(Number(e.target.value))}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', padding: '6px 12px', borderRadius: 6, fontSize: '0.82rem' }}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={60}>Last 60 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <select
            value={platform}
            onChange={e => setPlatform(e.target.value)}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', padding: '6px 12px', borderRadius: 6, fontSize: '0.82rem' }}
          >
            <option value="">All Platforms</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="linkedin">LinkedIn</option>
            <option value="website">Website</option>
          </select>
          <button
            onClick={load}
            style={{ background: '#C49A6C', color: '#1a2632', padding: '6px 14px', borderRadius: 6, border: 'none', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 0 }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '8px 16px', fontSize: '0.85rem', fontWeight: activeTab === tab.id ? 600 : 400,
              color: activeTab === tab.id ? '#C49A6C' : 'rgba(255,255,255,0.5)',
              borderBottom: activeTab === tab.id ? '2px solid #C49A6C' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '60px 0' }}>Loading metrics…</div>}

      {/* OVERVIEW TAB */}
      {!loading && activeTab === 'overview' && (
        <div>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
            <KpiCard label="Impressions" value={(totals?.impressions ?? 0).toLocaleString()} sub={`${days}d window`} />
            <KpiCard label="Reach" value={(totals?.reach ?? 0).toLocaleString()} />
            <KpiCard label="Clicks" value={(totals?.clicks ?? 0).toLocaleString()} />
            <KpiCard label="Reactions" value={(totals?.reactions ?? 0).toLocaleString()} />
            <KpiCard label="Comments" value={(totals?.comments ?? 0).toLocaleString()} />
            <KpiCard label="Shares" value={(totals?.shares ?? 0).toLocaleString()} />
            <KpiCard label="Leads" value={(totals?.leads ?? 0).toLocaleString()} />
            <KpiCard label="Eng. Rate" value={engRate} sub="(react+comment+share)/reach" />
          </div>

          {/* Trend + Platform breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(196,154,108,0.15)', borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: '0.78rem', color: '#C49A6C', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Engagement Trend</div>
              <TrendChart trend={data?.trend ?? []} />
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>Daily total engagements (last 21 data points)</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(196,154,108,0.15)', borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: '0.78rem', color: '#C49A6C', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>By Platform — Reach</div>
              {platforms.length === 0 && <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>No platform data yet</div>}
              {platforms.map(p => (
                <div key={p} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: '0.78rem', color: PLATFORM_COLORS[p] ?? '#fff', marginBottom: 4, textTransform: 'capitalize' }}>{p}</div>
                  <MiniBar value={data!.byPlatform[p].reach} max={maxPlatformReach} color={PLATFORM_COLORS[p] ?? '#C49A6C'} />
                </div>
              ))}
            </div>
          </div>

          {/* Recent Posts */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(196,154,108,0.15)', borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: '0.78rem', color: '#C49A6C', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>Recent Posts</div>
            {(!data?.recentPosts?.length) && <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>No posts ingested yet. Use POST /api/social/ingest to add data.</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(data?.recentPosts ?? []).map(post => {
                const m = post.metrics[0]
                const eng = m ? m.reactions + m.comments + m.shares : 0
                return (
                  <div key={post.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '0.7rem', color: PLATFORM_COLORS[post.platform] ?? '#fff', textTransform: 'uppercase', letterSpacing: 1, marginRight: 8 }}>{post.platform}</span>
                      <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block', maxWidth: '60%', verticalAlign: 'middle' }}>{post.caption}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
                      {m && (
                        <>
                          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>👍 {m.reactions}</span>
                          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>💬 {m.comments}</span>
                          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>🔁 {m.shares}</span>
                        </>
                      )}
                      <span style={{ fontSize: '0.75rem', color: eng > 50 ? '#22c55e' : 'rgba(255,255,255,0.3)' }}>{eng} eng</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* INSIGHTS TAB */}
      {!loading && activeTab === 'insights' && (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>{data?.insights?.length ?? 0} open insights</div>
          </div>
          {(!data?.insights?.length) && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 32, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
              No open insights yet. Insights are generated automatically from engagement spikes and weekly reports.
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(data?.insights ?? []).map(ins => (
              <div key={ins.id} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${SEVERITY_COLORS[ins.severity] ?? '#555'}40`, borderLeft: `3px solid ${SEVERITY_COLORS[ins.severity] ?? '#555'}`, borderRadius: 8, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#fff' }}>{ins.title}</span>
                  <span style={{ fontSize: '0.7rem', color: SEVERITY_COLORS[ins.severity] ?? '#fff', textTransform: 'uppercase', letterSpacing: 1 }}>{ins.severity}</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.65)', marginBottom: ins.action ? 8 : 0 }}>{ins.summary}</p>
                {ins.action && <p style={{ fontSize: '0.8rem', color: '#C49A6C' }}>→ {ins.action}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SENTIMENT TAB */}
      {activeTab === 'sentiment' && (
        <div style={{ maxWidth: 640 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: '0.78rem', color: '#C49A6C', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Analyze a Comment or Message</div>
            <textarea
              value={sentimentText}
              onChange={e => setSentimentText(e.target.value)}
              placeholder="Paste a social media comment, DM, or review here…"
              rows={4}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', padding: '12px', borderRadius: 8, fontSize: '0.9rem', resize: 'vertical', fontFamily: 'inherit' }}
            />
            <button
              onClick={runSentiment}
              disabled={sentimentLoading || !sentimentText.trim()}
              style={{ marginTop: 10, background: '#C49A6C', color: '#1a2632', padding: '10px 20px', borderRadius: 6, border: 'none', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', opacity: sentimentLoading ? 0.7 : 1 }}
            >
              {sentimentLoading ? 'Analyzing…' : '✨ Analyze Sentiment'}
            </button>
          </div>

          {sentimentResult && !('error' in sentimentResult) && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(196,154,108,0.2)', borderRadius: 10, padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                {[
                  ['Sentiment', String(sentimentResult.sentiment)],
                  ['Confidence', `${Math.round(Number(sentimentResult.confidence) * 100)}%`],
                  ['Intent', String(sentimentResult.intent)],
                  ['Urgency', String(sentimentResult.urgency)],
                  ['Lead Potential', String(sentimentResult.lead_potential)],
                  ['Compliance Risk', String(sentimentResult.compliance_risk)],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: '0.68rem', color: '#C49A6C', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>{k}</div>
                    <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 500 }}>{v}</div>
                  </div>
                ))}
              </div>
              {Array.isArray(sentimentResult.topics) && sentimentResult.topics.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: '0.68rem', color: '#C49A6C', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Topics</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {(sentimentResult.topics as string[]).map(t => (
                      <span key={t} style={{ background: 'rgba(196,154,108,0.15)', border: '1px solid rgba(196,154,108,0.3)', color: '#C49A6C', padding: '2px 10px', borderRadius: 12, fontSize: '0.75rem' }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {sentimentResult.recommended_action && (
                <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 6, padding: '10px 14px' }}>
                  <div style={{ fontSize: '0.68rem', color: '#22c55e', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Recommended Action</div>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>{String(sentimentResult.recommended_action)}</div>
                </div>
              )}
            </div>
          )}
          {sentimentResult && 'error' in sentimentResult && (
            <div style={{ color: '#ef4444', fontSize: '0.85rem' }}>{String(sentimentResult.error)}</div>
          )}
        </div>
      )}

      {/* WEEKLY REPORT TAB */}
      {activeTab === 'reports' && (
        <div style={{ maxWidth: 720 }}>
          <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>Generate a new AI-powered weekly performance report.</div>
            </div>
            <button
              onClick={runWeeklyReport}
              disabled={weeklyLoading}
              style={{ background: '#C49A6C', color: '#1a2632', padding: '10px 20px', borderRadius: 6, border: 'none', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', opacity: weeklyLoading ? 0.7 : 1 }}
            >
              {weeklyLoading ? 'Generating…' : '📊 Generate Weekly Report'}
            </button>
          </div>

          {weeklyReport && !('error' in weeklyReport) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {weeklyReport.summary && (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(196,154,108,0.2)', borderRadius: 10, padding: 20 }}>
                  <div style={{ fontSize: '0.72rem', color: '#C49A6C', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Executive Summary</div>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', lineHeight: 1.6 }}>{String(weeklyReport.summary)}</p>
                </div>
              )}
              {([
                ['KPI Highlights', weeklyReport.kpi_highlights],
                ['Top Performing', weeklyReport.top_performing],
                ['Growth Opportunities', weeklyReport.growth_opportunities],
                ['Risks to Watch', weeklyReport.risks],
                ['Recommended Actions', weeklyReport.recommended_actions],
                ['Recommended Posts', weeklyReport.recommended_posts],
              ] as [string, unknown][]).map(([title, items]) =>
                Array.isArray(items) && items.length > 0 ? (
                  <div key={title} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 20 }}>
                    <div style={{ fontSize: '0.72rem', color: '#C49A6C', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>{title}</div>
                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                      {items.map((item, i) => (
                        <li key={i} style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem', marginBottom: 6, lineHeight: 1.5 }}>{String(item)}</li>
                      ))}
                    </ul>
                  </div>
                ) : null
              )}
            </div>
          )}
          {weeklyReport && 'error' in weeklyReport && (
            <div style={{ color: '#ef4444', fontSize: '0.85rem' }}>{String(weeklyReport.error)}</div>
          )}
        </div>
      )}
    </div>
  )
}
