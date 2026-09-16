'use client'

import { useState } from 'react'
import { MessageSquareText, Sparkles, ShieldCheck } from 'lucide-react'
import { COLORS } from '@/lib/brand'
import { trackLatimoreEvent } from '@/lib/tracking/client-events'

type CoachResult = {
  acknowledgment: string
  reframe: string
  evidence: string
  softClose: string
  fullScript: string
  doNotSay: string[]
}

const categories = ['General', 'Life Protection', 'Living Benefits', 'Mortgage Protection', 'Retirement Income', 'Final Expense', 'Business Protection', 'Legacy Planning']

export default function ConversationCoachPage() {
  const [objection, setObjection] = useState('')
  const [audience, setAudience] = useState('families and homeowners')
  const [category, setCategory] = useState('General')
  const [result, setResult] = useState<CoachResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate(event: React.FormEvent) {
    event.preventDefault()
    if (objection.trim().length < 3) return
    setLoading(true)
    setError(null)
    setResult(null)
    void trackLatimoreEvent({ action: 'search_performed', tool: 'conversation_coach', category, metadata: { objectionLengthBand: objection.length < 50 ? 'short' : objection.length < 150 ? 'medium' : 'long' } })

    try {
      const response = await fetch('/api/ai/objection-handler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objection,
          audience,
          context: `${category}. Latimore presentation rule: use carrier-neutral, solution-level language only. Do not name insurance carriers, distributors, proprietary insurance products, or invented Latimore product names. Focus on the client concern, educational framing, and a low-pressure next step.`,
        }),
      })
      const payload = await response.json()
      if (!response.ok || !payload?.ok || !payload?.result) throw new Error(payload?.error || 'Coach response unavailable')
      setResult(payload.result as CoachResult)
      void trackLatimoreEvent({ action: 'tool_completed', tool: 'conversation_coach', category, resultBand: 'response_generated' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Coach response unavailable')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl p-5 md:p-8">
      <div className="mb-7 flex flex-col gap-2">
        <p className="text-xs font-black uppercase tracking-[0.26em]" style={{ color: COLORS.gold }}>Latimore Advisor OS</p>
        <h1 className="text-3xl font-black text-white md:text-4xl">Conversation Coach</h1>
        <p className="max-w-3xl text-sm leading-6" style={{ color: COLORS.inkMuted }}>
          Enter the exact client concern. The coach returns a carrier-neutral response framework: acknowledge, reframe, support, and move to a low-pressure next step.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[.78fr_1.22fr]">
        <form onSubmit={generate} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 md:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl p-2" style={{ background: 'rgba(201,162,95,.14)', color: COLORS.goldLight }}><MessageSquareText size={20} /></div>
            <div>
              <h2 className="font-black text-white">Client concern</h2>
              <p className="text-xs" style={{ color: COLORS.inkMuted }}>Use their actual words.</p>
            </div>
          </div>

          <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.inkMuted }}>Solution context</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {categories.map((item) => (
              <button key={item} type="button" onClick={() => setCategory(item)} className="rounded-full border px-3 py-2 text-xs font-bold" style={{ borderColor: category === item ? COLORS.gold : 'rgba(255,255,255,.12)', background: category === item ? 'rgba(201,162,95,.12)' : 'transparent', color: category === item ? COLORS.goldLight : COLORS.inkMuted }}>
                {item}
              </button>
            ))}
          </div>

          <label className="mt-5 block text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.inkMuted }}>Audience</label>
          <input value={audience} onChange={(e) => setAudience(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-[#C9A25F]" />

          <label className="mt-5 block text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.inkMuted }}>What did they say?</label>
          <textarea value={objection} onChange={(e) => setObjection(e.target.value)} rows={7} placeholder="Example: I need to think about it because I'm not sure this fits the budget right now." className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white outline-none focus:border-[#C9A25F]" />

          <button disabled={loading || objection.trim().length < 3} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-black disabled:opacity-50" style={{ background: COLORS.gold, color: COLORS.navyDeep }}>
            <Sparkles size={16} /> {loading ? 'Building Response…' : 'Build Response'}
          </button>
          <p className="mt-3 text-xs leading-5" style={{ color: COLORS.inkMuted }}>No carrier names or proprietary product names are requested or required.</p>
        </form>

        <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 md:p-6">
          {!result && !error ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
              <ShieldCheck size={38} style={{ color: COLORS.gold }} />
              <h2 className="mt-4 text-xl font-black text-white">Education-first response structure</h2>
              <p className="mt-2 max-w-md text-sm leading-6" style={{ color: COLORS.inkMuted }}>The response will appear here with a full script and a short coaching section.</p>
            </div>
          ) : null}

          {error ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div> : null}

          {result ? (
            <div className="space-y-5">
              <div className="rounded-xl border p-5" style={{ borderColor: 'rgba(201,162,95,.28)', background: 'rgba(201,162,95,.07)' }}>
                <p className="text-xs font-black uppercase tracking-wider" style={{ color: COLORS.goldLight }}>Full response</p>
                <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-white">{result.fullScript}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {[
                  ['Acknowledge', result.acknowledgment],
                  ['Reframe', result.reframe],
                  ['Support', result.evidence],
                  ['Low-pressure next step', result.softClose],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-white/10 bg-black/15 p-4">
                    <p className="text-xs font-black uppercase tracking-wider" style={{ color: COLORS.goldLight }}>{label}</p>
                    <p className="mt-2 text-sm leading-6 text-white/80">{value}</p>
                  </div>
                ))}
              </div>

              {result.doNotSay?.length ? (
                <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
                  <p className="text-xs font-black uppercase tracking-wider text-amber-200">Avoid</p>
                  <ul className="mt-2 space-y-2 text-sm text-white/75">
                    {result.doNotSay.map((item) => <li key={item}>• {item}</li>)}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  )
}
