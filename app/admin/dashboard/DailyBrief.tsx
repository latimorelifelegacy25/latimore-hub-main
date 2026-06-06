'use client'

import { useCallback, useEffect, useState } from 'react'

interface DailyBriefReport {
  summary: string
  hotLeads: Array<{
    contactId: string
    inquiryId: string | null
    name: string
    stage: string | null
    reason: string
    recommendedAction: string
  }>
  atRiskLeads: Array<{
    contactId: string
    inquiryId: string | null
    name: string
    stage: string | null
    risk: string
    recommendedAction: string
  }>
  overdueTasks: Array<{
    taskId: string
    title: string
    contactName: string | null
    dueAt: string | null
  }>
  pipelineInsights: string[]
  recommendedFocus: string[]
}

interface DailyBriefData {
  ok: boolean
  generatedAt?: string
  brief?: DailyBriefReport
}

export default function DailyBrief() {
  const [briefing, setBriefing] = useState<DailyBriefData | null>(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)

  useEffect(() => {
    fetch('/api/ai/daily-brief/latest', {
      method: 'GET',
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        setBriefing(data)
        setLoading(false)
      })
      .catch(error => {
        console.error('Failed to load daily brief:', error)
        setLoading(false)
      })
  }, [])

  useEffect(() => { void loadSaved() }, [loadSaved])

  const regenerate = async () => {
    setRegenerating(true)
    try {
      const res = await fetch('/api/ai/daily-brief', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 10 }),
      })
      const data = await res.json()
      setBriefing(data)
    } catch {
      // silently fail — stale brief stays visible
    } finally {
      setRegenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white">
        <div className="animate-pulse">
          <div className="h-6 bg-white/10 rounded mb-4"></div>
          <div className="h-4 bg-white/10 rounded mb-2"></div>
          <div className="h-4 bg-white/10 rounded mb-2"></div>
          <div className="h-4 bg-white/5 rounded"></div>
        </div>
      </div>
    )
  }

  if (!briefing?.ok || !briefing.brief) {
    return (
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-black">Daily Brief</h3>
          <button
            onClick={regenerate}
            disabled={regenerating}
            className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 disabled:opacity-50 transition"
          >
            {regenerating ? 'Generating…' : 'Generate Now'}
          </button>
        </div>
        <p className="text-slate-400 text-sm">No brief generated yet today. Click Generate Now to create one.</p>
      </div>
    )
  }

  const { brief } = briefing
  const hotLeadCount = brief.hotLeads?.length ?? 0
  const overdueTaskCount = brief.overdueTasks?.length ?? 0

  return (
    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-black">Daily Brief</h3>
          <p className="text-slate-400 text-sm">
            {briefing.generatedAt ? new Date(briefing.generatedAt).toLocaleDateString() : new Date().toLocaleDateString()}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-right text-sm">
            <div className="text-emerald-400 font-semibold">{hotLeadCount} Hot Leads</div>
            <div className="text-amber-400">{overdueTaskCount} Overdue Tasks</div>
          </div>
          <button
            onClick={regenerate}
            disabled={regenerating}
            className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 disabled:opacity-50 transition"
          >
            {regenerating ? 'Generating…' : 'Regenerate'}
          </button>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-sm font-black uppercase tracking-widest text-[#C49A6C] mb-3">Summary</h4>
        <p className="text-sm leading-6 text-slate-300">{brief.summary}</p>
      </div>

      {brief.pipelineInsights?.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-black uppercase tracking-widest text-[#C49A6C] mb-3">Pipeline Insights</h4>
          <ul className="space-y-2 text-sm text-slate-300">
            {brief.pipelineInsights.slice(0, 3).map((insight, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {brief.recommendedFocus?.length > 0 && (
        <div>
          <h4 className="text-sm font-black uppercase tracking-widest text-[#C49A6C] mb-3">Recommended Focus</h4>
          <ul className="space-y-2 text-sm text-slate-300">
            {brief.recommendedFocus.slice(0, 4).map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
