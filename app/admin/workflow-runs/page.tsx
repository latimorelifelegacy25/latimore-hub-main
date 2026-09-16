'use client'

import { useEffect, useMemo, useState } from 'react'
import { Activity, AlertTriangle, CheckCircle2, Clock3, Coins, RefreshCw, Workflow } from 'lucide-react'
import { COLORS } from '@/lib/brand'

type WorkflowRun = {
  id: string
  created_at: string
  workflow_name: string
  workflow_version: string | null
  trigger_type: string | null
  status: string
  started_at: string | null
  completed_at: string | null
  duration_ms: number | null
  steps: unknown
  error: string | null
  compliance_passed: boolean | null
  compliance_notes: string | null
  tokens_used: number
  estimated_cost: number
}

type AuditRow = {
  id: string
  created_at: string
  action: string
  actor_label: string | null
  entity_id: string
  after_state: unknown
}

type Payload = {
  ok: boolean
  available?: boolean
  error?: string
  data?: {
    metrics: {
      totalRuns: number
      completed: number
      failed: number
      running: number
      successRate: number
      totalTokens: number
      totalEstimatedCost: number
      averageDurationMs: number
    }
    runs: WorkflowRun[]
    audit: AuditRow[]
  }
}

function money(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 4 }).format(value)
}

function duration(value: number | null) {
  if (!value) return '—'
  if (value < 1000) return `${value} ms`
  return `${(value / 1000).toFixed(1)} s`
}

function statusClass(status: string) {
  if (status === 'completed') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
  if (status === 'failed') return 'border-red-500/30 bg-red-500/10 text-red-300'
  if (status === 'running') return 'border-sky-500/30 bg-sky-500/10 text-sky-300'
  return 'border-white/10 bg-white/5 text-white/60'
}

export default function WorkflowRunsPage() {
  const [payload, setPayload] = useState<Payload | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/workflows/runs', { cache: 'no-store' })
      const json = await res.json()
      setPayload(json)
      if (json?.data?.runs?.length && !selectedId) setSelectedId(json.data.runs[0].id)
    } catch {
      setPayload({ ok: false, error: 'Failed to load workflow telemetry.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const selected = useMemo(
    () => payload?.data?.runs.find(run => run.id === selectedId) ?? null,
    [payload, selectedId],
  )

  const selectedAudit = useMemo(
    () => payload?.data?.audit.filter(row => row.entity_id === selectedId) ?? [],
    [payload, selectedId],
  )

  const metrics = payload?.data?.metrics

  return (
    <main className="mx-auto max-w-7xl p-5 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.26em]" style={{ color: COLORS.gold }}>Latimore OS</p>
          <h1 className="mt-2 text-3xl font-black text-white md:text-4xl">Workflow Operations</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6" style={{ color: COLORS.inkMuted }}>
            Execution history, compliance outcomes, token usage, estimated AI cost, duration, failures, and immutable workflow audit events.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black disabled:opacity-50"
          style={{ background: COLORS.gold, color: COLORS.navy }}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {!payload?.ok && !loading ? (
        <div className="mt-8 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5 text-amber-100">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-black">Workflow telemetry is not available yet.</p>
              <p className="mt-1 text-sm text-amber-100/75">{payload?.error || 'The connected database does not have readable workflow telemetry.'}</p>
            </div>
          </div>
        </div>
      ) : null}

      {metrics ? (
        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Workflow Runs', value: metrics.totalRuns.toLocaleString(), icon: Workflow },
            { label: 'Success Rate', value: `${(metrics.successRate * 100).toFixed(1)}%`, icon: CheckCircle2 },
            { label: 'Avg. Duration', value: duration(metrics.averageDurationMs), icon: Clock3 },
            { label: 'Estimated AI Cost', value: money(metrics.totalEstimatedCost), icon: Coins },
          ].map(card => {
            const Icon = card.icon
            return (
              <article key={card.label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                <Icon size={20} style={{ color: COLORS.goldLight }} />
                <p className="mt-4 text-2xl font-black text-white">{card.value}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em]" style={{ color: COLORS.inkMuted }}>{card.label}</p>
              </article>
            )
          })}
        </section>
      ) : null}

      {payload?.data ? (
        <section className="mt-8 grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
            <div className="border-b border-white/10 px-5 py-4">
              <h2 className="font-black text-white">Recent Runs</h2>
              <p className="mt-1 text-xs" style={{ color: COLORS.inkMuted }}>Newest 100 workflow executions from the Latimore OS harness.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-white/[0.03] text-xs uppercase tracking-wider" style={{ color: COLORS.inkMuted }}>
                  <tr>
                    <th className="px-4 py-3">Workflow</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3">Tokens</th>
                    <th className="px-4 py-3">Cost</th>
                    <th className="px-4 py-3">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {payload.data.runs.map(run => (
                    <tr
                      key={run.id}
                      onClick={() => setSelectedId(run.id)}
                      className={`cursor-pointer border-t border-white/5 transition hover:bg-white/[0.04] ${selectedId === run.id ? 'bg-white/[0.05]' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-bold text-white">{run.workflow_name}</div>
                        <div className="mt-1 text-xs" style={{ color: COLORS.inkMuted }}>{run.trigger_type || '—'} · v{run.workflow_version || '—'}</div>
                      </td>
                      <td className="px-4 py-3"><span className={`rounded-full border px-2.5 py-1 text-xs font-black ${statusClass(run.status)}`}>{run.status}</span></td>
                      <td className="px-4 py-3 text-white/75">{duration(run.duration_ms)}</td>
                      <td className="px-4 py-3 text-white/75">{run.tokens_used.toLocaleString()}</td>
                      <td className="px-4 py-3 text-white/75">{money(run.estimated_cost)}</td>
                      <td className="px-4 py-3 text-white/55">{new Date(run.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
            <div className="flex items-center gap-2">
              <Activity size={18} style={{ color: COLORS.goldLight }} />
              <h2 className="font-black text-white">Run Detail</h2>
            </div>
            {!selected ? (
              <p className="mt-4 text-sm" style={{ color: COLORS.inkMuted }}>Select a workflow run.</p>
            ) : (
              <div className="mt-5 space-y-5 text-sm">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: COLORS.inkMuted }}>Run ID</p>
                  <p className="mt-1 break-all font-mono text-xs text-white/75">{selected.id}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-xs text-white/45">Compliance</p><p className="mt-1 font-bold text-white">{selected.compliance_passed === null ? 'Not required' : selected.compliance_passed ? 'Passed' : 'Review needed'}</p></div>
                  <div><p className="text-xs text-white/45">Audit events</p><p className="mt-1 font-bold text-white">{selectedAudit.length}</p></div>
                </div>
                {selected.error ? (
                  <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-red-200">
                    <p className="font-black">Failure</p>
                    <p className="mt-1 break-words text-xs">{selected.error}</p>
                  </div>
                ) : null}
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: COLORS.inkMuted }}>Steps</p>
                  <pre className="mt-2 max-h-72 overflow-auto rounded-xl bg-black/25 p-3 text-[11px] leading-5 text-white/70">{JSON.stringify(selected.steps, null, 2)}</pre>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: COLORS.inkMuted }}>Audit Trail</p>
                  <div className="mt-2 space-y-2">
                    {selectedAudit.length ? selectedAudit.map(row => (
                      <div key={row.id} className="rounded-xl border border-white/8 bg-white/[0.025] p-3">
                        <p className="font-bold text-white">{row.action}</p>
                        <p className="mt-1 text-xs text-white/45">{new Date(row.created_at).toLocaleString()} · {row.actor_label || 'Latimore OS'}</p>
                      </div>
                    )) : <p className="text-xs text-white/45">No audit events recorded for this run yet.</p>}
                  </div>
                </div>
              </div>
            )}
          </aside>
        </section>
      ) : null}
    </main>
  )
}
