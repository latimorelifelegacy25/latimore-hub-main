'use client'

import { useEffect, useState } from 'react'

interface DailyBriefData {
  ok: boolean
  briefing?: {
    date: string
    metrics: {
      totalContacts: number
      activeInquiries: number
      bookedAppointments: number
      hotLeads: number
      overdueTasks: number
    }
    insights: string[]
    priorityActions: Array<{
      type: string
      priority: string
      title: string
      items: string[]
    }>
    recentActivity: number
  }
}

export default function DailyBrief() {
  const [briefing, setBriefing] = useState<DailyBriefData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/ai/daily-brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit: 10 })
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

  if (!briefing?.ok || !briefing.briefing) {
    return (
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white">
        <h3 className="text-xl font-black mb-4">Daily Brief</h3>
        <p className="text-slate-400">Unable to load today's briefing.</p>
      </div>
    )
  }

  const { metrics, insights, priorityActions } = briefing.briefing

  return (
    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-black">Daily Brief</h3>
          <p className="text-slate-400 text-sm">{new Date().toLocaleDateString()}</p>
        </div>
        <div className="text-right text-sm">
          <div className="text-emerald-400 font-semibold">{metrics.hotLeads} Hot Leads</div>
          <div className="text-amber-400">{metrics.overdueTasks} Overdue Tasks</div>
        </div>
      </div>

      {/* Key Insights */}
      {insights.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-black uppercase tracking-widest text-[#C49A6C] mb-3">Key Insights</h4>
          <ul className="space-y-2">
            {insights.slice(0, 3).map((insight, i) => (
              <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                <i className="fa-solid fa-lightbulb text-[#C49A6C] mt-0.5"></i>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Priority Actions */}
      {priorityActions.length > 0 && (
        <div>
          <h4 className="text-sm font-black uppercase tracking-widest text-[#C49A6C] mb-3">Priority Actions</h4>
          <div className="space-y-3">
            {priorityActions.slice(0, 2).map((action, i) => (
              <div key={i} className={`p-3 rounded-xl border ${
                action.priority === 'high'
                  ? 'bg-red-500/10 border-red-500/20'
                  : 'bg-amber-500/10 border-amber-500/20'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <i className={`fa-solid ${
                    action.priority === 'high' ? 'fa-exclamation-triangle text-red-400' : 'fa-clock text-amber-400'
                  }`}></i>
                  <span className="text-sm font-semibold">{action.title}</span>
                </div>
                <ul className="text-xs text-slate-400 space-y-1">
                  {action.items.slice(0, 2).map((item, j) => (
                    <li key={j}>• {item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}