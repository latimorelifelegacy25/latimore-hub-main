'use client'

import React, { useState, useEffect, useCallback } from 'react'

// ─── Brand tokens ────────────────────────────────────────────────────────────
const G = '#C9A25F'          // gold
const NAVY = '#0B0F17'
const SURF = '#131929'
const SURF2 = '#1a2535'
const INK = '#F7F7F5'
const MUTED = '#A9B1BE'
const BORDER = '#2a3548'

// ─── Types ───────────────────────────────────────────────────────────────────
type TriggerType = 'manual' | 'webhook' | 'cron' | 'crm_stage'
type StepType = 'email' | 'sms' | 'social_post' | 'ai_generate' | 'delay' | 'condition'

interface WorkflowStep {
  id?: string
  order: number
  type: StepType
  label: string
  config: Record<string, string | number | boolean | string[]>
}

interface Workflow {
  id?: string
  name: string
  description: string
  triggerType: TriggerType
  triggerValue: string
  category: string
  tags: string[]
  isActive: boolean
  isPreset?: boolean
  runCount?: number
  lastRunAt?: string
  steps: WorkflowStep[]
}

// ─── Presets ─────────────────────────────────────────────────────────────────
const PRESETS: Workflow[] = [
  {
    name: 'Always-Updated Audit Loop',
    description: 'Runs a nightly codebase audit and emails the daily brief to the admin inbox.',
    triggerType: 'cron',
    triggerValue: '0 0 * * *',
    category: 'Ops',
    tags: ['audit', 'nightly'],
    isActive: false,
    isPreset: true,
    steps: [
      { order: 0, type: 'ai_generate', label: 'Generate Audit Report', config: { prompt: 'Analyze pipeline activity, lead scores, and flagged contacts from the past 24 hours. Summarize in 5 bullet points.' } },
      { order: 1, type: 'email', label: 'Send Daily Brief', config: { subject: 'Latimore OS — Daily Audit Brief', bodyText: '{{ai_output}}' } },
    ],
  },
  {
    name: 'Brand Compliance Audit',
    description: 'Triggered when a lead enters the Follow Up stage. Checks messaging compliance and alerts the agent.',
    triggerType: 'crm_stage',
    triggerValue: 'Follow Up',
    category: 'Compliance',
    tags: ['brand', 'compliance', 'crm'],
    isActive: false,
    isPreset: true,
    steps: [
      { order: 0, type: 'ai_generate', label: 'Run Compliance Check', config: { prompt: 'Review the last 3 notes and messages for this contact. Flag any language that violates compliance guidelines or appears fear-based.' } },
      { order: 1, type: 'condition', label: 'Flag Check', config: { field: 'compliance_score', operator: 'lt', value: '80' } },
      { order: 2, type: 'email', label: 'Alert Agent', config: { subject: 'Brand Compliance Flag — Action Required', bodyText: 'A compliance issue was detected for {{contact_name}}. Review immediately.' } },
    ],
  },
  {
    name: 'SLA Underwriting Verification',
    description: 'Fires when a lead reaches Qualified stage. Auto-generates underwriting notes and notifies the agent.',
    triggerType: 'crm_stage',
    triggerValue: 'Qualified',
    category: 'Underwriting',
    tags: ['sla', 'underwriting', 'crm'],
    isActive: false,
    isPreset: true,
    steps: [
      { order: 0, type: 'ai_generate', label: 'Generate Underwriting Notes', config: { prompt: 'Based on the contact profile, recommend the most suitable products and flag any underwriting concerns.' } },
      { order: 1, type: 'email', label: 'Notify Agent', config: { subject: 'Underwriting Summary — {{contact_name}}', bodyText: '{{ai_output}}' } },
    ],
  },
  {
    name: 'Lead Enrichment Stream',
    description: 'Triggered by a Fillout form submission. Enriches the lead, sends a welcome email, waits 24h, then sends an SMS follow-up.',
    triggerType: 'webhook',
    triggerValue: 'fillout_form',
    category: 'Lead Gen',
    tags: ['fillout', 'webhook', 'enrichment'],
    isActive: false,
    isPreset: true,
    steps: [
      { order: 0, type: 'ai_generate', label: 'Enrich Lead Data', config: { prompt: 'Summarize the lead based on form fields and suggest the best product fit and follow-up approach.' } },
      { order: 1, type: 'email', label: 'Welcome Email', config: { subject: 'Welcome — Let\'s Protect Your Family', bodyText: 'Hi {{first_name}}, thank you for reaching out! I\'ll be in touch shortly to review your options. — Jackson Latimore' } },
      { order: 2, type: 'delay', label: 'Wait 24 Hours', config: { amount: 24, unit: 'hours' } },
      { order: 3, type: 'sms', label: 'SMS Follow-Up', config: { body: 'Hi {{first_name}}, this is Jackson with Latimore Life & Legacy. Did you have a chance to review our email? Reply PROTECT to get started.' } },
    ],
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
const TRIGGER_META: Record<TriggerType, { label: string; color: string; icon: string }> = {
  manual:    { label: 'Manual',     color: '#6B7280', icon: '▶️' },
  webhook:   { label: 'Webhook',    color: '#3B82F6', icon: '🔗' },
  cron:      { label: 'Scheduled',  color: '#8B5CF6', icon: '⏰' },
  crm_stage: { label: 'CRM Stage',  color: '#F59E0B', icon: '🎯' },
}

const STEP_META: Record<StepType, { label: string; icon: string }> = {
  email:       { label: 'Send Email',        icon: '✉️' },
  sms:         { label: 'Send SMS',          icon: '📱' },
  social_post: { label: 'Social Post',       icon: '📣' },
  ai_generate: { label: 'AI Generate',       icon: '🤖' },
  delay:       { label: 'Delay / Wait',      icon: '⏳' },
  condition:   { label: 'Condition Branch',  icon: '🔀' },
}

const STAGES = ['New', 'Attempted Contact', 'Contacted', 'Qualified', 'Follow Up', 'Booked', 'In Consult', 'Closed Won', 'Nurture']

function cronToHuman(expr: string): string {
  const m: Record<string, string> = {
    '0 0 * * *': 'Every night at midnight',
    '0 8 * * 1-5': 'Weekdays at 8:00 AM',
    '0 8 * * 1': 'Every Monday at 8:00 AM',
    '*/15 * * * *': 'Every 15 minutes',
    '0 0 * * 0': 'Every Sunday at midnight',
  }
  return m[expr] || expr
}

const blankWorkflow = (): Workflow => ({
  name: '', description: '', triggerType: 'manual', triggerValue: '',
  category: '', tags: [], isActive: false, steps: [],
})

const blankStep = (order: number): WorkflowStep => ({
  order, type: 'email', label: '', config: {},
})

// ─── Styled sub-components ────────────────────────────────────────────────────
function TriggerPill({ type }: { type: TriggerType }) {
  const m = TRIGGER_META[type]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: m.color + '22', color: m.color, border: `1px solid ${m.color}55` }}>
      {m.icon} {m.label}
    </span>
  )
}

function SBtn({ children, onClick, variant = 'primary', disabled = false, small = false }: {
  children: React.ReactNode; onClick?: () => void; variant?: 'primary' | 'ghost' | 'danger'; disabled?: boolean; small?: boolean
}) {
  const bg = variant === 'primary' ? G : variant === 'danger' ? '#EF4444' : 'transparent'
  const col = variant === 'primary' ? NAVY : variant === 'danger' ? '#fff' : MUTED
  const bdr = variant === 'ghost' ? `1px solid ${BORDER}` : 'none'
  return (
    <button onClick={onClick} disabled={disabled} style={{ padding: small ? '5px 12px' : '9px 18px', borderRadius: 8, background: bg, color: col, fontWeight: 700, fontSize: small ? '0.78rem' : '0.88rem', border: bdr, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, transition: 'opacity 0.15s' }}>
      {children}
    </button>
  )
}

// ─── Step editor ─────────────────────────────────────────────────────────────
function StepEditor({ step, onChange, onDelete, onMove, isFirst, isLast }: {
  step: WorkflowStep; onChange: (s: WorkflowStep) => void; onDelete: () => void; onMove: (dir: -1 | 1) => void; isFirst: boolean; isLast: boolean
}) {
  const set = (k: string, v: string | number) => onChange({ ...step, config: { ...step.config, [k]: v } })

  return (
    <div style={{ background: NAVY, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '1rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ color: MUTED, fontSize: '0.75rem', fontWeight: 700, minWidth: 24 }}>#{step.order + 1}</span>
        <select value={step.type} onChange={e => onChange({ ...step, type: e.target.value as StepType, config: {} })} style={{ background: SURF2, border: `1px solid ${BORDER}`, color: INK, borderRadius: 6, padding: '4px 8px', fontSize: '0.82rem', flex: 1 }}>
          {(Object.keys(STEP_META) as StepType[]).map(t => <option key={t} value={t}>{STEP_META[t].icon} {STEP_META[t].label}</option>)}
        </select>
        <input value={step.label} onChange={e => onChange({ ...step, label: e.target.value })} placeholder="Step label…" style={{ flex: 2, background: SURF2, border: `1px solid ${BORDER}`, color: INK, borderRadius: 6, padding: '4px 8px', fontSize: '0.82rem' }} />
        <button onClick={() => onMove(-1)} disabled={isFirst} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: '1rem', opacity: isFirst ? 0.3 : 1 }}>↑</button>
        <button onClick={() => onMove(1)} disabled={isLast} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: '1rem', opacity: isLast ? 0.3 : 1 }}>↓</button>
        <button onClick={onDelete} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
      </div>

      {/* Step-specific config fields */}
      {step.type === 'email' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <input value={String(step.config.subject ?? '')} onChange={e => set('subject', e.target.value)} placeholder="Email subject…" style={{ background: SURF2, border: `1px solid ${BORDER}`, color: INK, borderRadius: 6, padding: '5px 8px', fontSize: '0.8rem' }} />
          <textarea value={String(step.config.bodyText ?? '')} onChange={e => set('bodyText', e.target.value)} placeholder="Email body… (use {{first_name}}, {{ai_output}} as variables)" rows={3} style={{ background: SURF2, border: `1px solid ${BORDER}`, color: INK, borderRadius: 6, padding: '5px 8px', fontSize: '0.8rem', resize: 'vertical' }} />
        </div>
      )}
      {step.type === 'sms' && (
        <textarea value={String(step.config.body ?? '')} onChange={e => set('body', e.target.value)} placeholder="SMS body… (use {{first_name}} as variable)" rows={2} style={{ background: SURF2, border: `1px solid ${BORDER}`, color: INK, borderRadius: 6, padding: '5px 8px', fontSize: '0.8rem', resize: 'vertical' }} />
      )}
      {step.type === 'social_post' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <select value={String(step.config.platform ?? 'facebook')} onChange={e => set('platform', e.target.value)} style={{ background: SURF2, border: `1px solid ${BORDER}`, color: INK, borderRadius: 6, padding: '5px 8px', fontSize: '0.8rem' }}>
            {['facebook', 'instagram', 'linkedin'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <textarea value={String(step.config.caption ?? '')} onChange={e => set('caption', e.target.value)} placeholder="Post caption… (include #TheBeatGoesOn)" rows={3} style={{ background: SURF2, border: `1px solid ${BORDER}`, color: INK, borderRadius: 6, padding: '5px 8px', fontSize: '0.8rem', resize: 'vertical' }} />
        </div>
      )}
      {step.type === 'ai_generate' && (
        <textarea value={String(step.config.prompt ?? '')} onChange={e => set('prompt', e.target.value)} placeholder="AI instruction prompt… Output is stored as {{ai_output}}" rows={3} style={{ background: SURF2, border: `1px solid ${BORDER}`, color: INK, borderRadius: 6, padding: '5px 8px', fontSize: '0.8rem', resize: 'vertical' }} />
      )}
      {step.type === 'delay' && (
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="number" min={1} value={Number(step.config.amount ?? 1)} onChange={e => set('amount', +e.target.value)} style={{ background: SURF2, border: `1px solid ${BORDER}`, color: INK, borderRadius: 6, padding: '5px 8px', fontSize: '0.8rem', width: 80 }} />
          <select value={String(step.config.unit ?? 'hours')} onChange={e => set('unit', e.target.value)} style={{ background: SURF2, border: `1px solid ${BORDER}`, color: INK, borderRadius: 6, padding: '5px 8px', fontSize: '0.8rem' }}>
            {['minutes', 'hours', 'days'].map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      )}
      {step.type === 'condition' && (
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={String(step.config.field ?? '')} onChange={e => set('field', e.target.value)} placeholder="field" style={{ background: SURF2, border: `1px solid ${BORDER}`, color: INK, borderRadius: 6, padding: '5px 8px', fontSize: '0.8rem', flex: 1 }} />
          <select value={String(step.config.operator ?? 'eq')} onChange={e => set('operator', e.target.value)} style={{ background: SURF2, border: `1px solid ${BORDER}`, color: INK, borderRadius: 6, padding: '5px 8px', fontSize: '0.8rem' }}>
            {['eq', 'neq', 'gt', 'lt', 'contains'].map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <input value={String(step.config.value ?? '')} onChange={e => set('value', e.target.value)} placeholder="value" style={{ background: SURF2, border: `1px solid ${BORDER}`, color: INK, borderRadius: 6, padding: '5px 8px', fontSize: '0.8rem', flex: 1 }} />
        </div>
      )}
    </div>
  )
}

// ─── Trigger config panel ─────────────────────────────────────────────────────
function TriggerPanel({ workflow, onChange }: { workflow: Workflow; onChange: (w: Workflow) => void }) {
  const t = workflow.triggerType
  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        {(Object.keys(TRIGGER_META) as TriggerType[]).map(tt => {
          const m = TRIGGER_META[tt]
          const active = t === tt
          return (
            <button key={tt} onClick={() => onChange({ ...workflow, triggerType: tt, triggerValue: '' })} style={{ padding: '10px 12px', borderRadius: 8, border: `2px solid ${active ? m.color : BORDER}`, background: active ? m.color + '18' : 'transparent', color: active ? m.color : MUTED, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>{m.icon}</span> {m.label}
            </button>
          )
        })}
      </div>

      {t === 'manual' && (
        <p style={{ color: MUTED, fontSize: '0.82rem', margin: 0 }}>This workflow is triggered manually from the dashboard or via the Run Now button.</p>
      )}
      {t === 'webhook' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ color: MUTED, fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase' }}>Webhook Key</label>
          <input value={workflow.triggerValue} onChange={e => onChange({ ...workflow, triggerValue: e.target.value })} placeholder="e.g. fillout_form, contact_form, booking" style={{ background: NAVY, border: `1px solid ${BORDER}`, color: INK, borderRadius: 6, padding: '7px 10px', fontSize: '0.85rem' }} />
          <div style={{ background: NAVY, borderRadius: 8, padding: '10px 12px', border: `1px solid ${BORDER}`, fontFamily: 'monospace', fontSize: '0.75rem', color: MUTED, wordBreak: 'break-all' }}>
            POST {origin}/api/webhooks/booking?key={workflow.triggerValue || 'your-key'}
          </div>
        </div>
      )}
      {t === 'cron' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ color: MUTED, fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase' }}>Cron Expression</label>
          <input value={workflow.triggerValue} onChange={e => onChange({ ...workflow, triggerValue: e.target.value })} placeholder="0 8 * * 1-5" style={{ background: NAVY, border: `1px solid ${BORDER}`, color: INK, borderRadius: 6, padding: '7px 10px', fontSize: '0.85rem', fontFamily: 'monospace' }} />
          {workflow.triggerValue && <div style={{ color: G, fontSize: '0.8rem' }}>📅 {cronToHuman(workflow.triggerValue)}</div>}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {['0 0 * * *', '0 8 * * 1-5', '0 8 * * 1', '*/15 * * * *'].map(expr => (
              <button key={expr} onClick={() => onChange({ ...workflow, triggerValue: expr })} style={{ padding: '3px 10px', borderRadius: 20, background: SURF2, border: `1px solid ${BORDER}`, color: MUTED, fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'monospace' }}>{expr}</button>
            ))}
          </div>
        </div>
      )}
      {t === 'crm_stage' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ color: MUTED, fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase' }}>CRM Stage</label>
          <select value={workflow.triggerValue} onChange={e => onChange({ ...workflow, triggerValue: e.target.value })} style={{ background: NAVY, border: `1px solid ${BORDER}`, color: INK, borderRadius: 6, padding: '7px 10px', fontSize: '0.85rem' }}>
            <option value="">Select stage…</option>
            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {workflow.triggerValue && <div style={{ color: G, fontSize: '0.8rem' }}>🎯 Fires when a contact enters <strong>{workflow.triggerValue}</strong></div>}
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function MarketingCommandCenter() {
  const [tab, setTab] = useState<'builder' | 'campaigns' | 'calculator'>('builder')
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [selected, setSelected] = useState<Workflow | null>(null)
  const [saving, setSaving] = useState(false)
  const [executing, setExecuting] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000) }

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/marketing/workflows')
      if (res.ok) {
        const data = await res.json()
        setWorkflows(data.workflows ?? [])
      }
    } catch { /* db may be offline */ }
  }, [])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const isNew = !selected.id
      const url = isNew ? '/api/marketing/workflows' : `/api/marketing/workflows/${selected.id}`
      const res = await fetch(url, { method: isNew ? 'POST' : 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(selected) })
      const data = await res.json()
      if (data.ok) { showToast(isNew ? 'Workflow created!' : 'Saved!'); await load(); setSelected(data.workflow) }
      else showToast('Save failed', false)
    } catch { showToast('Network error', false) }
    setSaving(false)
  }

  const runNow = async (id: string) => {
    setExecuting(id)
    try {
      const res = await fetch(`/api/marketing/workflows/${id}/execute`, { method: 'POST' })
      const data = await res.json()
      if (data.ok) showToast(`▶ Executed ${data.results?.length ?? 0} steps`)
      else showToast('Execution failed', false)
    } catch { showToast('Network error', false) }
    setExecuting(null)
  }

  const deleteWf = async (id: string) => {
    if (!confirm('Delete this workflow?')) return
    await fetch(`/api/marketing/workflows/${id}`, { method: 'DELETE' })
    setSelected(null); await load(); showToast('Deleted')
  }

  const toggleActive = async (wf: Workflow) => {
    if (!wf.id) return
    const res = await fetch(`/api/marketing/workflows/${wf.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !wf.isActive }) })
    if (res.ok) { await load(); if (selected?.id === wf.id) setSelected({ ...selected, isActive: !wf.isActive }) }
  }

  const addStep = () => {
    if (!selected) return
    setSelected({ ...selected, steps: [...selected.steps, blankStep(selected.steps.length)] })
  }

  const updateStep = (i: number, s: WorkflowStep) => {
    if (!selected) return
    const steps = [...selected.steps]; steps[i] = s
    setSelected({ ...selected, steps })
  }

  const deleteStep = (i: number) => {
    if (!selected) return
    const steps = selected.steps.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, order: idx }))
    setSelected({ ...selected, steps })
  }

  const moveStep = (i: number, dir: -1 | 1) => {
    if (!selected) return
    const steps = [...selected.steps]
    const j = i + dir
    if (j < 0 || j >= steps.length) return
    ;[steps[i], steps[j]] = [steps[j], steps[i]]
    setSelected({ ...selected, steps: steps.map((s, idx) => ({ ...s, order: idx })) })
  }

  const savedWorkflows = workflows.filter(w => !w.isPreset)

  const h2 = { margin: '0 0 1rem', fontSize: '1rem', fontWeight: 800, color: G, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }
  const sectionCard = { background: SURF, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '1.25rem' }

  return (
    <div style={{ background: NAVY, minHeight: '100vh', color: INK, fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 999, background: toast.ok ? G : '#EF4444', color: toast.ok ? NAVY : '#fff', padding: '12px 20px', borderRadius: 10, fontWeight: 700, fontSize: '0.9rem', boxShadow: '0 4px 24px #0008' }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ background: SURF, borderBottom: `1px solid ${BORDER}`, padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, background: G, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>⚡</div>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: INK }}>Marketing Command Center</div>
            <div style={{ fontSize: '0.75rem', color: MUTED }}>Latimore Life & Legacy · Workflow Automation</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['builder', 'campaigns', 'calculator'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${tab === t ? G : BORDER}`, background: tab === t ? G + '18' : 'transparent', color: tab === t ? G : MUTED, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
              {t === 'builder' ? '⚙️ Workflows' : t === 'campaigns' ? '📊 Active Campaigns' : '🧮 Quote Calc'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Workflow Builder Tab ── */}
      {tab === 'builder' && (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', minHeight: 'calc(100vh - 65px)' }}>

          {/* Left: Template Gallery */}
          <div style={{ background: SURF, borderRight: `1px solid ${BORDER}`, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>
            <div>
              <h2 style={h2}>Built-In Presets</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {PRESETS.map((p, i) => {
                  const isSelected = selected?.name === p.name && !selected?.id
                  return (
                    <button key={i} onClick={() => setSelected({ ...p })} style={{ background: isSelected ? G + '18' : NAVY, border: `1px solid ${isSelected ? G : BORDER}`, borderRadius: 10, padding: '10px 12px', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ color: INK, fontWeight: 700, fontSize: '0.85rem' }}>{p.name}</div>
                      <TriggerPill type={p.triggerType} />
                      <div style={{ color: MUTED, fontSize: '0.75rem', lineHeight: 1.4 }}>{p.description.slice(0, 80)}…</div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h2 style={{ ...h2, margin: 0 }}>My Workflows</h2>
                <SBtn small onClick={() => setSelected(blankWorkflow())}>+ New</SBtn>
              </div>
              {savedWorkflows.length === 0
                ? <p style={{ color: MUTED, fontSize: '0.8rem' }}>No saved workflows yet. Select a preset or click + New.</p>
                : savedWorkflows.map(wf => (
                  <button key={wf.id} onClick={() => setSelected(wf)} style={{ width: '100%', background: selected?.id === wf.id ? G + '18' : NAVY, border: `1px solid ${selected?.id === wf.id ? G : BORDER}`, borderRadius: 10, padding: '10px 12px', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: INK, fontWeight: 700, fontSize: '0.85rem' }}>{wf.name}</span>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: wf.isActive ? '#22C55E' : '#6B7280', flexShrink: 0 }} />
                    </div>
                    <TriggerPill type={wf.triggerType} />
                    <div style={{ color: MUTED, fontSize: '0.72rem' }}>Runs: {wf.runCount ?? 0} · {wf.lastRunAt ? new Date(wf.lastRunAt).toLocaleDateString() : 'Never run'}</div>
                  </button>
                ))
              }
            </div>
          </div>

          {/* Right: Editor */}
          <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
            {!selected ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16 }}>
                <div style={{ fontSize: 48 }}>⚡</div>
                <h2 style={{ margin: 0, color: INK, fontSize: '1.3rem', fontWeight: 800 }}>Select a template or create a new workflow</h2>
                <p style={{ color: MUTED, maxWidth: 400, textAlign: 'center' }}>Choose from the 4 built-in presets on the left, or click <strong>+ New</strong> to build from scratch.</p>
                <SBtn onClick={() => setSelected(blankWorkflow())}>+ Create Workflow</SBtn>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 780 }}>

                {/* Name + Description */}
                <div style={sectionCard}>
                  <h2 style={h2}>Workflow Details</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <input value={selected.name} onChange={e => setSelected({ ...selected, name: e.target.value })} placeholder="Workflow name…" style={{ background: NAVY, border: `1px solid ${BORDER}`, color: INK, borderRadius: 8, padding: '9px 12px', fontSize: '1rem', fontWeight: 700 }} />
                    <textarea value={selected.description} onChange={e => setSelected({ ...selected, description: e.target.value })} placeholder="What does this workflow do?" rows={2} style={{ background: NAVY, border: `1px solid ${BORDER}`, color: INK, borderRadius: 8, padding: '9px 12px', fontSize: '0.88rem', resize: 'vertical' }} />
                    <div style={{ display: 'flex', gap: 10 }}>
                      <input value={selected.category} onChange={e => setSelected({ ...selected, category: e.target.value })} placeholder="Category (e.g. Lead Gen, Ops)" style={{ flex: 1, background: NAVY, border: `1px solid ${BORDER}`, color: INK, borderRadius: 8, padding: '7px 10px', fontSize: '0.85rem' }} />
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: MUTED, fontSize: '0.85rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={selected.isActive} onChange={e => setSelected({ ...selected, isActive: e.target.checked })} style={{ accentColor: G }} />
                        Active
                      </label>
                    </div>
                  </div>
                </div>

                {/* Trigger Config */}
                <div style={sectionCard}>
                  <h2 style={h2}>⚡ Trigger Configuration</h2>
                  <TriggerPanel workflow={selected} onChange={setSelected} />
                </div>

                {/* Steps */}
                <div style={sectionCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ ...h2, margin: 0 }}>📋 Steps ({selected.steps.length})</h2>
                    <SBtn small onClick={addStep}>+ Add Step</SBtn>
                  </div>
                  {selected.steps.length === 0
                    ? <p style={{ color: MUTED, fontSize: '0.85rem' }}>No steps yet. Click + Add Step to build the workflow actions.</p>
                    : selected.steps.map((s, i) => (
                      <div key={i} style={{ marginBottom: 10 }}>
                        <StepEditor step={s} onChange={ns => updateStep(i, ns)} onDelete={() => deleteStep(i)} onMove={dir => moveStep(i, dir)} isFirst={i === 0} isLast={i === selected.steps.length - 1} />
                      </div>
                    ))
                  }
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <SBtn onClick={save} disabled={saving || !selected.name}>{saving ? 'Saving…' : selected.id ? '💾 Save Changes' : '💾 Save Workflow'}</SBtn>
                  {selected.id && (
                    <>
                      <SBtn variant="ghost" onClick={() => toggleActive(selected)}>{selected.isActive ? '⏸ Deactivate' : '▶ Activate'}</SBtn>
                      {selected.triggerType === 'manual' && (
                        <SBtn variant="ghost" onClick={() => selected.id && runNow(selected.id)} disabled={executing === selected.id}>{executing === selected.id ? 'Running…' : '▶ Run Now'}</SBtn>
                      )}
                      <SBtn variant="danger" onClick={() => selected.id && deleteWf(selected.id)}>Delete</SBtn>
                    </>
                  )}
                  {selected.isPreset && !selected.id && (
                    <p style={{ color: MUTED, fontSize: '0.8rem', margin: 'auto 0' }}>Save this preset to activate it or customize the steps.</p>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Active Campaigns Tab ── */}
      {tab === 'campaigns' && (
        <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ ...h2, fontSize: '1.2rem' }}>📊 Active Campaigns & Workflow Dashboard</h2>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Total Workflows', value: workflows.length, icon: '⚙️' },
              { label: 'Active', value: workflows.filter(w => w.isActive).length, icon: '🟢' },
              { label: 'Total Runs', value: workflows.reduce((a, w) => a + (w.runCount ?? 0), 0), icon: '▶️' },
              { label: 'Presets Available', value: PRESETS.length, icon: '📦' },
            ].map(stat => (
              <div key={stat.label} style={{ background: SURF2, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: '1.5rem' }}>{stat.icon}</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: G }}>{stat.value}</div>
                <div style={{ color: MUTED, fontSize: '0.8rem' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Workflow table */}
          <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {['Workflow', 'Trigger', 'Status', 'Steps', 'Runs', 'Last Run', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: MUTED, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {workflows.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: MUTED }}>No saved workflows yet. Go to the Workflow Builder tab to create one.</td></tr>
                )}
                {workflows.map(wf => (
                  <tr key={wf.id} style={{ borderBottom: `1px solid ${BORDER}20` }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: INK, fontSize: '0.88rem' }}>{wf.name}</div>
                      {wf.category && <div style={{ color: MUTED, fontSize: '0.75rem' }}>{wf.category}</div>}
                    </td>
                    <td style={{ padding: '12px 16px' }}><TriggerPill type={wf.triggerType} /></td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', fontWeight: 600, color: wf.isActive ? '#22C55E' : MUTED }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: wf.isActive ? '#22C55E' : '#6B7280' }} />
                        {wf.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: MUTED, fontSize: '0.85rem' }}>{(wf.steps as WorkflowStep[]).length}</td>
                    <td style={{ padding: '12px 16px', color: G, fontWeight: 700 }}>{wf.runCount ?? 0}</td>
                    <td style={{ padding: '12px 16px', color: MUTED, fontSize: '0.8rem' }}>{wf.lastRunAt ? new Date(wf.lastRunAt).toLocaleDateString() : '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <SBtn small variant="ghost" onClick={() => { setSelected(wf); setTab('builder') }}>Edit</SBtn>
                        {wf.triggerType === 'manual' && <SBtn small onClick={() => wf.id && runNow(wf.id)} disabled={executing === wf.id}>{executing === wf.id ? '…' : '▶'}</SBtn>}
                        <SBtn small variant="ghost" onClick={() => toggleActive(wf)}>{wf.isActive ? '⏸' : '▶'}</SBtn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Quote Calculator Tab ── */}
      {tab === 'calculator' && (
        <div style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
            <h2 style={{ ...h2, margin: 0 }}>🧮 Insurance Quote Calculator</h2>
            <a href="/marketing/quote-calculator" target="_blank" rel="noreferrer" style={{ color: G, fontSize: '0.8rem', textDecoration: 'none', border: `1px solid ${G}44`, padding: '4px 10px', borderRadius: 6 }}>Open full page ↗</a>
          </div>
          <iframe src="/marketing/quote-calculator" style={{ width: '100%', height: 'calc(100vh - 160px)', border: 'none', borderRadius: 12 }} title="Quote Calculator" />
        </div>
      )}
    </div>
  )
}
