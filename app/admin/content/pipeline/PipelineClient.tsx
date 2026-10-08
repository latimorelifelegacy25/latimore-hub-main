'use client'

import { useCallback, useEffect, useState } from 'react'
import AdminCard from '@/app/admin/_components/AdminCard'

type Brief = {
  needsMoreInput: boolean
  missingInputs: string[]
  angle: string
  audience: string
  keyMessage: string
  mustIncludeFacts: { fact: string; source: string }[]
  callToAction: string
  targetLength: string
}
type Review = {
  effectiveStatus: 'APPROVED' | 'CHANGES_REQUESTED'
  draftRevision: number
  issues: { severity: string; location: string; problem: string; suggestedFix: string }[]
  unsupportedClaims: string[]
  compliance: { violations: { rule: string; description: string; excerpt: string }[] }
}
type State = { stage: string; topic: string; brief: Brief | null; draftRevision: number; writerFlags: string[]; reviews: Review[] }
type Variant = {
  id: string
  channel: string | null
  status: string
  bodyText: string | null
  metadata: { subject?: string; proposedSendAt?: string; compliance?: { passed: boolean } } | null
}
type Detail = { id: string; title: string; draft: string | null; state: State; variants: Variant[] }
type ListItem = { id: string; title: string; stage: string }

const STAGE_LABEL: Record<string, string> = {
  needs_input: 'Needs more input',
  briefed: 'Brief ready',
  changes_requested: 'Editor flagged issues',
  editor_approved: 'Editor approved',
  repurposed: 'Variants staged',
}

const input = 'w-full rounded-xl border border-white/10 bg-[#0B1220] px-3 py-2 text-sm text-white outline-none focus:border-[#C9A25F]'
const btn = 'rounded-xl bg-[#C9A25F] px-4 py-2 text-sm font-semibold text-[#0E1A2B] disabled:opacity-50'
const btnGhost = 'rounded-xl border border-white/15 px-4 py-2 text-sm text-white disabled:opacity-50'

export default function PipelineClient() {
  const [list, setList] = useState<ListItem[]>([])
  const [detail, setDetail] = useState<Detail | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [topic, setTopic] = useState('')
  const [source, setSource] = useState('')
  const [goals, setGoals] = useState('')
  const [extra, setExtra] = useState('')
  const [voice, setVoice] = useState('')
  const [editText, setEditText] = useState<string | null>(null)

  const refreshList = useCallback(async () => {
    const res = await fetch('/api/content/pipeline').then((r) => r.json()).catch(() => null)
    if (res?.ok) setList(res.pipelines)
  }, [])

  useEffect(() => {
    void refreshList()
  }, [refreshList])

  async function call(url: string, init: RequestInit) {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json' } })
      const json = await res.json().catch(() => null)
      if (!json?.ok) throw new Error(typeof json?.error === 'string' ? json.error : 'Request failed')
      return json
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
      return null
    } finally {
      setBusy(false)
    }
  }

  async function open(id: string) {
    const json = await call(`/api/content/pipeline/${id}`, { method: 'GET' })
    if (json) {
      setDetail(json)
      setEditText(null)
    }
  }

  async function create() {
    const json = await call('/api/content/pipeline', {
      method: 'POST',
      body: JSON.stringify({ topic, sourceMaterial: source, channelGoals: goals }),
    })
    if (json) {
      setTopic('')
      setSource('')
      setGoals('')
      await refreshList()
      await open(json.id)
    }
  }

  async function act(body: Record<string, unknown>) {
    if (!detail) return
    const json = await call(`/api/content/pipeline/${detail.id}`, { method: 'POST', body: JSON.stringify(body) })
    if (json) {
      setDetail(json)
      setEditText(null)
      setExtra('')
      await refreshList()
    }
  }

  const state = detail?.state
  const latest = state?.reviews.at(-1)

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <div className="space-y-6">
        <AdminCard title="New topic" subtitle="Paste your notes. The Strategist only uses facts that appear in them.">
          <div className="space-y-3 p-5">
            <input className={input} placeholder="Topic or idea" value={topic} onChange={(e) => setTopic(e.target.value)} />
            <textarea className={input} rows={6} placeholder="Source material: notes, data, past posts" value={source} onChange={(e) => setSource(e.target.value)} />
            <textarea className={input} rows={2} placeholder="Channel goals (optional)" value={goals} onChange={(e) => setGoals(e.target.value)} />
            <button className={btn} disabled={busy || topic.trim().length < 5 || !source.trim()} onClick={create}>
              {busy ? 'Working…' : 'Create brief'}
            </button>
          </div>
        </AdminCard>
        <AdminCard title="Pipelines">
          <ul className="divide-y divide-white/5">
            {list.length === 0 && <li className="p-5 text-sm text-[#A9B1BE]">None yet.</li>}
            {list.map((item) => (
              <li key={item.id}>
                <button onClick={() => open(item.id)} className="w-full px-5 py-3 text-left hover:bg-white/[0.03]">
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <p className="text-xs text-[#C9A25F]">{STAGE_LABEL[item.stage] ?? item.stage}</p>
                </button>
              </li>
            ))}
          </ul>
        </AdminCard>
      </div>

      <div className="space-y-6">
        {error && <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}
        {!detail && <p className="text-sm text-[#A9B1BE]">Create or select a pipeline.</p>}

        {detail && state && (
          <>
            <AdminCard title={detail.title} subtitle={`Stage: ${STAGE_LABEL[state.stage] ?? state.stage} · draft revision ${state.draftRevision}`}>
              <div className="space-y-4 p-5 text-sm text-[#E6EAF0]">
                {state.brief && (
                  <div className="space-y-2">
                    <p><span className="text-[#C9A25F]">Angle:</span> {state.brief.angle}</p>
                    <p><span className="text-[#C9A25F]">Audience:</span> {state.brief.audience}</p>
                    <p><span className="text-[#C9A25F]">Key message:</span> {state.brief.keyMessage}</p>
                    <p><span className="text-[#C9A25F]">CTA:</span> {state.brief.callToAction}</p>
                    <ul className="list-disc pl-5">
                      {state.brief.mustIncludeFacts.map((f, i) => (
                        <li key={i}>{f.fact} <span className="text-[#8F98A8]">({f.source})</span></li>
                      ))}
                    </ul>
                  </div>
                )}

                {state.stage === 'needs_input' && (
                  <div className="space-y-2 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4">
                    <p className="font-semibold text-amber-200">The Strategist needs more material before it can write a brief:</p>
                    <ul className="list-disc pl-5">{state.brief?.missingInputs.map((m, i) => <li key={i}>{m}</li>)}</ul>
                    <textarea className={input} rows={4} placeholder="Add the missing material" value={extra} onChange={(e) => setExtra(e.target.value)} />
                    <button className={btn} disabled={busy || !extra.trim()} onClick={() => act({ action: 'provide_input', material: extra })}>
                      Re-run brief
                    </button>
                  </div>
                )}

                {state.stage !== 'needs_input' && state.stage !== 'repurposed' && (
                  <div className="space-y-2">
                    <input className={input} placeholder="Voice notes (optional): a sentence or two on tone" value={voice} onChange={(e) => setVoice(e.target.value)} />
                    <div className="flex flex-wrap gap-2">
                      <button className={btn} disabled={busy || state.stage === 'editor_approved'} onClick={() => act({ action: 'draft', voiceNotes: voice || undefined })}>
                        {busy ? 'Working…' : detail.draft ? 'Revise with Editor feedback' : 'Write draft and review'}
                      </button>
                      {detail.draft && (
                        <button className={btnGhost} disabled={busy} onClick={() => act({ action: 'review' })}>Re-run Editor</button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </AdminCard>

            {detail.draft && (
              <AdminCard
                title="Draft"
                action={
                  editText === null ? (
                    <button className={btnGhost} onClick={() => setEditText(detail.draft)}>Edit by hand</button>
                  ) : null
                }
              >
                <div className="space-y-3 p-5">
                  {editText === null ? (
                    <p className="whitespace-pre-wrap text-sm leading-6 text-[#E6EAF0]">{detail.draft}</p>
                  ) : (
                    <>
                      <textarea className={input} rows={16} value={editText} onChange={(e) => setEditText(e.target.value)} />
                      <div className="flex gap-2">
                        <button className={btn} disabled={busy} onClick={() => act({ action: 'edit_draft', text: editText })}>Save (clears approval)</button>
                        <button className={btnGhost} onClick={() => setEditText(null)}>Cancel</button>
                      </div>
                    </>
                  )}
                  {state.writerFlags.length > 0 && (
                    <div className="text-xs text-[#A9B1BE]">
                      <p className="font-semibold">Writer flags</p>
                      <ul className="list-disc pl-5">{state.writerFlags.map((f, i) => <li key={i}>{f}</li>)}</ul>
                    </div>
                  )}
                </div>
              </AdminCard>
            )}

            {latest && (
              <AdminCard title="Editor review" subtitle={latest.effectiveStatus === 'APPROVED' ? 'APPROVED' : 'CHANGES REQUESTED'}>
                <div className="space-y-3 p-5 text-sm text-[#E6EAF0]">
                  {latest.draftRevision !== state.draftRevision && <p className="text-amber-200">This review is for an older revision.</p>}
                  {latest.compliance.violations.map((v, i) => (
                    <p key={`c${i}`} className="text-red-200">Compliance {v.rule}: {v.description} (“{v.excerpt}”)</p>
                  ))}
                  {latest.unsupportedClaims.map((c, i) => (
                    <p key={`u${i}`} className="text-red-200">Unsupported by brief: {c}</p>
                  ))}
                  {latest.issues.map((issue, i) => (
                    <div key={i} className="rounded-xl border border-white/8 p-3">
                      <p><span className="uppercase text-[#C9A25F]">{issue.severity}</span> · {issue.location}</p>
                      <p>{issue.problem}</p>
                      <p className="text-[#8F98A8]">Fix: {issue.suggestedFix}</p>
                    </div>
                  ))}
                  {latest.effectiveStatus === 'APPROVED' && state.stage === 'editor_approved' && (
                    <button className={btn} disabled={busy} onClick={() => act({ action: 'repurpose' })}>
                      {busy ? 'Working…' : 'Approve draft and stage social + email drafts'}
                    </button>
                  )}
                </div>
              </AdminCard>
            )}

            {detail.variants.length > 0 && (
              <AdminCard title="Channel variants" subtitle="Drafts only. Approving marks one ready; scheduling and publishing remain separate manual steps.">
                <div className="space-y-4 p-5">
                  {detail.variants.map((v) => (
                    <div key={v.id} className="rounded-xl border border-white/8 p-4 text-sm text-[#E6EAF0]">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold uppercase text-[#C9A25F]">{v.channel} · {v.status}</p>
                        <p className="text-xs text-[#8F98A8]">
                          Proposed: {v.metadata?.proposedSendAt ? new Date(v.metadata.proposedSendAt).toLocaleString() : '—'}
                        </p>
                      </div>
                      {v.metadata?.subject && <p className="mb-1 font-medium">Subject: {v.metadata.subject}</p>}
                      <p className="whitespace-pre-wrap leading-6">{v.bodyText}</p>
                      {v.metadata?.compliance && !v.metadata.compliance.passed && (
                        <p className="mt-2 text-red-200">Fails compliance; edit or reject.</p>
                      )}
                      {v.status === 'draft' && (
                        <div className="mt-3 flex gap-2">
                          <button className={btn} disabled={busy || v.metadata?.compliance?.passed === false} onClick={() => act({ action: 'approve_variant', variantId: v.id })}>Approve</button>
                          <button className={btnGhost} disabled={busy} onClick={() => act({ action: 'reject_variant', variantId: v.id })}>Reject</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </AdminCard>
            )}
          </>
        )}
      </div>
    </div>
  )
}
