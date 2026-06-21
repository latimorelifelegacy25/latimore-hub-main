'use client'

import { useEffect, useState, type ReactNode, type CSSProperties } from 'react'

// ── Data ──────────────────────────────────────────────────────────────────────

type TaskPri = 'high' | 'med' | 'low'
interface Task { text: string; pri: TaskPri; done: boolean }

const INITIAL_TASKS: Task[] = [
  { text: 'Pay PAHS CampusBox balance — $460 DUE TODAY', pri: 'high', done: false },
  { text: 'Follow up with Schuylkill Chamber EVP Samantha Chivinski re: Finance & Admin Coordinator role', pri: 'high', done: false },
  { text: 'Submit LAT-2026-01 pre-suit demand package to Diocese of Allentown', pri: 'high', done: false },
  { text: 'Review North American carrier appointment paperwork', pri: 'med', done: false },
  { text: 'Deploy Latimore Hub OS leads dashboard admin page to Vercel', pri: 'med', done: false },
  { text: 'Activate PAHS Full Circle Legacy QR funnel on latimorelifelegacy.com', pri: 'med', done: false },
  { text: 'Build Luzerne County Latino market landing page', pri: 'low', done: false },
  { text: 'Verify GA4 events — G-WZWMX83WXQ and G-S0Q3E4DEBJ', pri: 'low', done: false },
]

const PIPELINE = [
  { initials: 'SP', name: 'Schuylkill Pre-Retiree', stage: 'Quote', cls: 'quote', val: '$4,800/yr' },
  { initials: 'YF', name: 'Young Family — Frackville', stage: 'Lead', cls: 'lead', val: '$1,200/yr' },
  { initials: 'SV', name: 'Schuylkill Valley SD', stage: 'Active Prospect', cls: 'active', val: '$18,000/yr' },
  { initials: 'RC', name: 'Referral — Coal Region', stage: 'Closing', cls: 'close', val: '$2,400/yr' },
]

const DOCS = [
  { name: 'LAT-2026-01 Final Civil Complaint', date: 'May 2026', tag: 'Legal' },
  { name: 'Schuylkill Chamber Cover Letter & Resume', date: 'Apr 2026', tag: 'Career' },
  { name: 'PAHS Full Circle Sponsorship Invoice', date: 'Apr 2026', tag: 'Sponsorship' },
  { name: 'MBA Diploma — AIU Apr 7 2026', date: 'Apr 2026', tag: 'Credentials' },
  { name: 'Latino Market Playbook — Luzerne County', date: 'Apr 2026', tag: 'Marketing' },
  { name: 'Hub OS Vercel deploy config', date: 'May 2026', tag: 'Code' },
]

const LOGS = [
  { time: '09:14', cls: '#4ade80', msg: '✓  Latimore Hub OS — Vercel build passed' },
  { time: '09:10', cls: '#60a5fa', msg: '→  Supabase medxfhhxvmczmpurkmrp — schema sync OK' },
  { time: '08:55', cls: '#4ade80', msg: '✓  GA4 G-WZWMX83WXQ — events firing correctly' },
  { time: '08:40', cls: '#facc15', msg: '⚠  PAHS invoice $460 — DUE TODAY' },
  { time: '08:30', cls: '#60a5fa', msg: '→  Brand guardrails loaded — all workflows active' },
  { time: 'Yesterday', cls: '#4ade80', msg: '✓  LAT-2026-01 complaint package — finalized' },
]

const WORKFLOW_PROMPTS: Record<string, string> = {
  email: 'Run the Latimore brand content builder: create an on-brand email campaign for Pre-Retirees in Schuylkill County. Primary KPI: monthly application volume. Tone: urgent but NOT fear-based, empathetic, legacy-focused. Include a strong CTA. Use the Latimore Life & Legacy LLC voice — Protecting Today. Securing Tomorrow. #TheBeatGoesOn.',
  proposal: 'Run the school district proposal builder for a Schuylkill County district. Build a full proposal covering: Executive Summary, Current Risk Landscape, Latimore Solution Overview, Implementation Plan, Pricing, and Next Steps with CTA.',
  'brand-check': 'Run a Latimore brand compliance review. Return a compliance table with PASS/SOFT WARNING/FAIL ratings and a priority fix list against brand guardrails.',
  cta: 'Run the KPI-aligned CTA generator for Latimore Life & Legacy LLC. Target ICP: Pre-Retirees in Schuylkill County. Channel: Facebook. Generate 6 strong, on-brand calls to action.',
  audit: 'Run a Codex codebase audit on the Latimore Hub OS. Identify broken routes, missing env vars, Vercel deployment issues, and API route errors.',
  deploy: 'Generate deployment-ready Termux (Android) commands to push the latest Latimore Hub OS changes to GitHub and trigger a Vercel deploy. Include git add, git commit, git push, and Vercel CLI deploy command.',
  supabase: 'Run a Supabase data health check on project medxfhhxvmczmpurkmrp. Check CRM tables, admin routes, migration status, and Prisma schema drift.',
  'admin-page': 'Generate a new Latimore Hub OS admin page component — a leads dashboard (Next.js 14 App Router, TypeScript, Tailwind) that pulls from Supabase leads table with county filter. Output the full component code for /app/admin/leads/page.tsx.',
}

const FOLDERS = [
  { key: 'insurance', icon: '📁', name: 'Insurance & Carriers', sub: 'Appointments · Policies · Compliance' },
  { key: 'hubos', icon: '💻', name: 'Hub OS / Codebase', sub: 'Next.js · Supabase · Vercel' },
  { key: 'legal', icon: '⚖️', name: 'Legal — LAT-2026-01', sub: 'Complaint · Exhibits · Letters' },
  { key: 'pahs', icon: '🛡️', name: 'PAHS Campaign', sub: 'Sponsorship · QR Funnel · Invoice' },
  { key: 'marketing', icon: '📣', name: 'Marketing & Content', sub: 'Emails · Social · Landing Pages' },
  { key: 'credentials', icon: '🎓', name: 'Credentials & Licenses', sub: 'MBA · License #1268820 · GFI' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

async function callAI(prompt: string): Promise<string> {
  const res = await fetch('/api/hub-os/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.error ?? 'Request failed')
  return json?.text ?? ''
}

const PRI_COLORS: Record<TaskPri, { bg: string; text: string }> = {
  high: { bg: '#ff4444', text: '#fff' },
  med: { bg: '#C49A6C', text: '#000' },
  low: { bg: '#0f2a1a', text: '#4ade80' },
}

const STAGE_COLORS: Record<string, { bg: string; text: string }> = {
  lead: { bg: '#3a2f12', text: '#facc15' },
  quote: { bg: '#10233a', text: '#60a5fa' },
  close: { bg: '#0f2a1a', text: '#4ade80' },
  active: { bg: '#3a2f1f', text: '#C49A6C' },
}

// ── Main component ────────────────────────────────────────────────────────────

type Tab = 'dashboard' | 'revenue' | 'files' | 'tasks' | 'codex'

const NAV_TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '⬡' },
  { id: 'revenue', label: 'Revenue Engine', icon: '◎' },
  { id: 'files', label: 'File Vault', icon: '▣' },
  { id: 'tasks', label: 'Tasks', icon: '☑' },
  { id: 'codex', label: 'Codex Sync', icon: '>_' },
]

function Clock() {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  if (!now) return null
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: 11, color: '#C49A6C', fontWeight: 700, letterSpacing: 1 }}>
        {now.toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' }).toUpperCase()}
      </div>
      <div style={{ fontSize: 9, color: '#4a5568' }}>{now.toLocaleTimeString('en-US', { hour12: false })} EST</div>
    </div>
  )
}

function Ticker() {
  const msgs = LOGS.map(l => `[${l.time}] ${l.msg}`)
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % msgs.length), 3000)
    return () => clearInterval(t)
  }, [msgs.length])
  return (
    <div style={{ display: 'flex', gap: 32, alignItems: 'center', fontSize: 10, color: '#4ade80', fontFamily: 'monospace', overflow: 'hidden' }}>
      <span style={{ color: '#4ade80', marginRight: 8 }}>●</span>
      {msgs.map((m, i) => (
        <span key={i} style={{ opacity: i === idx ? 1 : 0.25, transition: 'opacity 0.4s', whiteSpace: 'nowrap', letterSpacing: 1 }}>{m}</span>
      ))}
    </div>
  )
}

function StatCard({ label, value, sub, warn }: { label: string; value: string; sub: string; warn: boolean }) {
  return (
    <div style={{ background: '#0a0e1a', border: '1px solid #1e2a3a', borderRadius: 8, padding: '14px 18px', flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 10, letterSpacing: 2, color: '#4a5568', fontFamily: 'monospace', marginBottom: 8 }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0', fontFamily: 'monospace' }}>{value}</div>
      <div style={{ fontSize: 10, marginTop: 6, color: warn ? '#facc15' : '#4ade80', fontFamily: 'monospace' }}>{sub}</div>
    </div>
  )
}

function WorkflowCard({ icon, title, desc, onClick }: { icon: string; title: string; desc: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: 'left', background: '#080c17', border: '1px solid #1e2a3a', borderRadius: 8,
        padding: '14px 16px', cursor: 'pointer', transition: 'all 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = '#C49A6C66')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = '#1e2a3a')}
    >
      <div style={{ width: 28, height: 28, borderRadius: 6, background: '#1f1810', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, fontSize: 13, color: '#C49A6C' }}>{icon}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', fontFamily: 'monospace', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 10, color: '#64748b', lineHeight: 1.5, marginBottom: 8 }}>{desc}</div>
      <div style={{ fontSize: 10, color: '#C49A6C', fontWeight: 700, letterSpacing: 0.5 }}>▶ LAUNCH</div>
    </button>
  )
}

function AiPanel({ title, children, output, loading, placeholder }: { title: string; children: ReactNode; output: string; loading: boolean; placeholder?: string }) {
  return (
    <div style={{ background: '#0a0e1a', border: '1px solid #1e2a3a', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ background: '#080c17', borderBottom: '1px solid #1e2a3a', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#C49A6C', fontSize: 12 }}>✦</span>
        <span style={{ color: '#C49A6C', fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>{title}</span>
      </div>
      <div style={{ padding: 12 }}>{children}</div>
      {output && (
        <div style={{ padding: '12px 14px', fontSize: 11, color: '#94a3b8', lineHeight: 1.6, borderTop: '1px solid #1e2a3a', whiteSpace: 'pre-wrap', maxHeight: 240, overflowY: 'auto', fontFamily: 'monospace' }}>
          {output}
        </div>
      )}
      {!output && placeholder && !loading && (
        <div style={{ padding: '12px 14px', fontSize: 11, color: '#4a5568', borderTop: '1px solid #1e2a3a' }}>{placeholder}</div>
      )}
    </div>
  )
}

const inputStyle: CSSProperties = {
  background: '#080c17', border: '1px solid #1e2a3a', borderRadius: 6,
  color: '#94a3b8', fontSize: 11, fontFamily: 'monospace', padding: '6px 10px',
}

const buttonStyle: CSSProperties = {
  background: '#C49A6C', color: '#000', border: 'none', borderRadius: 6,
  fontSize: 11, fontWeight: 700, fontFamily: 'monospace', padding: '7px 16px',
  cursor: 'pointer', whiteSpace: 'nowrap', letterSpacing: 0.5,
}

export default function HubOSClient() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS)

  // Revenue Engine
  const [revIcp, setRevIcp] = useState('Pre-Retirees — Schuylkill County')
  const [revAsset, setRevAsset] = useState('Email campaign')
  const [revKpi, setRevKpi] = useState('Monthly applications')
  const [revBrief, setRevBrief] = useState('')
  const [revOutput, setRevOutput] = useState('')
  const [revLoading, setRevLoading] = useState(false)

  // Tasks AI
  const [taskQ, setTaskQ] = useState('')
  const [taskOutput, setTaskOutput] = useState('')
  const [taskLoading, setTaskLoading] = useState(false)

  // Codex AI
  const [codexQ, setCodexQ] = useState('')
  const [codexOutput, setCodexOutput] = useState('')
  const [codexLoading, setCodexLoading] = useState(false)

  function toggleTask(i: number) {
    setTasks(prev => prev.map((t, idx) => idx === i ? { ...t, done: !t.done } : t))
  }

  async function runRevenueAI() {
    setRevLoading(true)
    setRevOutput('Generating…')
    try {
      const prompt = `You are the brand content builder for Latimore Life & Legacy LLC, an independent insurance brokerage in Pennsylvania's Coal Region (Schuylkill, Luzerne, Northumberland Counties). Founder: Jackson M. Latimore Sr. — survived cardiac arrest Dec 2010, saved by AED. Tagline: "Protecting Today. Securing Tomorrow. #TheBeatGoesOn."

Write a ${revAsset} for ICP: ${revIcp}. Primary KPI: ${revKpi}.${revBrief ? ' Additional context: ' + revBrief : ''}

Rules: urgent but NOT fear-based. Empathetic, legacy-focused. No guarantees of returns. Strong, specific CTA. Output ONLY the final copy, ready to use.`
      const text = await callAI(prompt)
      setRevOutput(text)
    } catch (e: any) {
      setRevOutput('Error: ' + e.message)
    } finally {
      setRevLoading(false)
    }
  }

  async function runTaskAI() {
    if (!taskQ.trim()) return
    setTaskLoading(true)
    setTaskOutput('Thinking…')
    try {
      const openTasks = tasks.filter(t => !t.done).map(t => '• ' + t.text).join('\n')
      const prompt = `You are the operations assistant for Jackson M. Latimore Sr., Founder & CEO of Latimore Life & Legacy LLC (Frackville, PA). Today is ${new Date().toLocaleDateString()}.

Open tasks:\n${openTasks}\n\nUser request: ${taskQ}`
      const text = await callAI(prompt)
      setTaskOutput(text)
    } catch (e: any) {
      setTaskOutput('Error: ' + e.message)
    } finally {
      setTaskLoading(false)
    }
  }

  async function runCodexAI() {
    if (!codexQ.trim()) return
    setCodexLoading(true)
    setCodexOutput('Running…')
    try {
      const prompt = `You are a senior full-stack developer working on the Latimore Hub OS for Latimore Life & Legacy LLC. Stack: Next.js 14 App Router, TypeScript, Prisma, Supabase (project: medxfhhxvmczmpurkmrp), Vercel, GitHub org: latimorelifelegacy25.

Task: ${codexQ}

Provide production-ready, copy-paste code or commands. Be specific and complete.`
      const text = await callAI(prompt)
      setCodexOutput(text)
    } catch (e: any) {
      setCodexOutput('Error: ' + e.message)
    } finally {
      setCodexLoading(false)
    }
  }

  async function launchWorkflow(key: string) {
    const prompt = WORKFLOW_PROMPTS[key]
    if (!prompt) return
    setTab('codex')
    setCodexQ(prompt)
    setCodexLoading(true)
    setCodexOutput('Running…')
    try {
      const text = await callAI(prompt)
      setCodexOutput(text)
    } catch (e: any) {
      setCodexOutput('Error: ' + e.message)
    } finally {
      setCodexLoading(false)
    }
  }

  const openTasks = tasks.filter(t => !t.done).length

  return (
    <div style={{
      background: '#050810', minHeight: '100vh', display: 'flex', flexDirection: 'column',
      fontFamily: "'Courier New', monospace", color: '#e2e8f0',
    }}>
      {/* TOP BAR */}
      <div style={{
        background: '#080c17', borderBottom: '1px solid #1e2a3a', padding: '10px 20px',
        display: 'flex', alignItems: 'center', gap: 16, height: 52,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, background: '#C49A6C', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14, color: '#000' }}>LL</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 3, color: '#e2e8f0' }}>LATIMORE HUB OS</span>
              <span style={{ fontSize: 8, padding: '1px 6px', border: '1px solid #C49A6C', color: '#C49A6C', borderRadius: 3, letterSpacing: 1 }}>LIVE</span>
            </div>
            <div style={{ fontSize: 8, color: '#4a5568', letterSpacing: 2 }}>REVENUE &amp; OPERATIONS COMMAND CENTER</div>
          </div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <Clock />
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* LEFT ICON RAIL */}
        <div style={{
          width: 56, background: '#080c17', borderRight: '1px solid #1e2a3a',
          display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 12, gap: 4,
        }}>
          {NAV_TABS.map(item => (
            <button
              key={item.id}
              title={item.label}
              onClick={() => setTab(item.id)}
              style={{
                width: 38, height: 38, background: tab === item.id ? '#0d1424' : 'transparent',
                border: tab === item.id ? '1px solid #C49A6C44' : '1px solid transparent',
                borderRadius: 6, color: tab === item.id ? '#C49A6C' : '#4a5568',
                fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', position: 'relative',
              }}
            >
              {item.icon}
              {item.id === 'tasks' && openTasks > 0 && (
                <span style={{
                  position: 'absolute', top: 2, right: 2, fontSize: 8, background: '#ff4444',
                  color: '#fff', borderRadius: 8, padding: '0 4px', fontWeight: 700,
                }}>{openTasks}</span>
              )}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, overflow: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ── DASHBOARD ───────────────────────────────────────── */}
          {tab === 'dashboard' && (
            <>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <StatCard label="Active Policies" value="1" sub="Target: 5/mo by Mo.12" warn />
                <StatCard label="Pipeline Value" value="$26.4K" sub="4 active prospects" warn={false} />
                <StatCard label="Referral Rate" value="12%" sub="Target: 20–30%" warn />
                <StatCard label="District Contacts" value="1" sub="Target: 3–5 by Mo.12" warn />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 9, letterSpacing: 2, color: '#4a5568' }}>QUICK-LAUNCH WORKFLOWS</span>
                  <span style={{ fontSize: 9, color: '#C49A6C', background: '#1f1810', padding: '2px 10px', borderRadius: 10 }}>#THEBEATGOESON</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <WorkflowCard icon="✉" title="Email Campaign Builder" desc="On-brand emails for pre-retirees, families, or school districts." onClick={() => launchWorkflow('email')} />
                  <WorkflowCard icon="🏫" title="District Proposal Builder" desc="Full school district B2B proposals covering risk and continuity." onClick={() => launchWorkflow('proposal')} />
                  <WorkflowCard icon="🛡" title="Brand Compliance Check" desc="Scored report against brand guardrails with a priority fix list." onClick={() => launchWorkflow('brand-check')} />
                  <WorkflowCard icon="◎" title="CTA Generator" desc="Generate KPI-linked calls to action for any ICP or channel." onClick={() => launchWorkflow('cta')} />
                </div>
              </div>

              <div style={{ background: '#0a0e1a', border: '1px solid #1e2a3a', borderRadius: 8, padding: '14px 18px' }}>
                <div style={{ fontSize: 9, letterSpacing: 2, color: '#4a5568', marginBottom: 10 }}>TODAY'S PRIORITIES</div>
                {tasks.slice(0, 3).map((t, i) => (
                  <TaskRow key={i} task={t} index={i} onToggle={toggleTask} />
                ))}
              </div>
            </>
          )}

          {/* ── REVENUE ENGINE ─────────────────────────────────── */}
          {tab === 'revenue' && (
            <>
              <div style={{ background: '#0a0e1a', border: '1px solid #1e2a3a', borderRadius: 8, padding: '14px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 9, letterSpacing: 2, color: '#4a5568' }}>REVENUE PIPELINE</span>
                  <span style={{ fontSize: 9, color: '#60a5fa', background: '#10233a', padding: '2px 10px', borderRadius: 10 }}>COAL REGION</span>
                </div>
                {PIPELINE.map((p, i) => {
                  const sc = STAGE_COLORS[p.cls]
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: i < PIPELINE.length - 1 ? '1px solid #1e2a3a' : 'none' }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#080c17', border: '1px solid #1e2a3a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#94a3b8', flexShrink: 0 }}>{p.initials}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>{p.name}</div>
                        <div style={{ fontSize: 10, color: '#64748b' }}>{p.stage}</div>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 10px', borderRadius: 10, background: sc.bg, color: sc.text }}>{p.stage}</span>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#C49A6C', flexShrink: 0 }}>{p.val}</div>
                    </div>
                  )
                })}
              </div>

              <AiPanel title="LATIMORE BRAND CONTENT BUILDER" output={revOutput} loading={revLoading} placeholder="Select your ICP, asset type, and KPI — then hit Generate to build on-brand revenue content.">
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                  <select value={revIcp} onChange={e => setRevIcp(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 150 }}>
                    <option>Pre-Retirees — Schuylkill County</option>
                    <option>Young Families — Coal Region</option>
                    <option>School Districts — Schuylkill</option>
                    <option>Latino Market — Luzerne County</option>
                  </select>
                  <select value={revAsset} onChange={e => setRevAsset(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 150 }}>
                    <option>Email campaign</option>
                    <option>Social post</option>
                    <option>One-page flyer</option>
                    <option>Follow-up phone script</option>
                    <option>Landing page copy</option>
                    <option>Referral request message</option>
                  </select>
                  <select value={revKpi} onChange={e => setRevKpi(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 150 }}>
                    <option>Monthly applications</option>
                    <option>Referral rate</option>
                    <option>District penetration</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <textarea
                    value={revBrief}
                    onChange={e => setRevBrief(e.target.value)}
                    placeholder="Optional: add a specific angle, product, event, or compliance note…"
                    style={{ ...inputStyle, flex: 1, resize: 'none', height: 56 }}
                  />
                  <button onClick={runRevenueAI} disabled={revLoading} style={{ ...buttonStyle, opacity: revLoading ? 0.6 : 1 }}>
                    {revLoading ? 'GENERATING…' : 'GENERATE ▶'}
                  </button>
                </div>
              </AiPanel>
            </>
          )}

          {/* ── FILE VAULT ─────────────────────────────────────── */}
          {tab === 'files' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 9, letterSpacing: 2, color: '#4a5568' }}>FILE VAULT</span>
                <span style={{ fontSize: 9, color: '#C49A6C', background: '#1f1810', padding: '2px 10px', borderRadius: 10 }}>ORGANIZED</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {FOLDERS.map(f => (
                  <button
                    key={f.key}
                    onClick={() => { navigator.clipboard?.writeText(`Open the Latimore ${f.name} folder.`).catch(() => {}) }}
                    style={{ textAlign: 'left', background: '#0a0e1a', border: '1px solid #1e2a3a', borderRadius: 8, padding: '14px 16px', cursor: 'pointer' }}
                  >
                    <div style={{ fontSize: 22, marginBottom: 8 }}>{f.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>{f.name}</div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>{f.sub}</div>
                  </button>
                ))}
              </div>

              <div style={{ background: '#0a0e1a', border: '1px solid #1e2a3a', borderRadius: 8, padding: '14px 18px' }}>
                <div style={{ fontSize: 9, letterSpacing: 2, color: '#4a5568', marginBottom: 10 }}>RECENT DOCUMENTS</div>
                {DOCS.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < DOCS.length - 1 ? '1px solid #1e2a3a' : 'none' }}>
                    <span style={{ color: '#4a5568', fontSize: 12 }}>▤</span>
                    <div style={{ flex: 1, fontSize: 11, color: '#94a3b8' }}>{d.name}</div>
                    <span style={{ fontSize: 9, color: '#C49A6C', background: '#1f1810', padding: '2px 8px', borderRadius: 8, flexShrink: 0 }}>{d.tag}</span>
                    <div style={{ fontSize: 10, color: '#4a5568', flexShrink: 0 }}>{d.date}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── TASKS ───────────────────────────────────────────── */}
          {tab === 'tasks' && (
            <>
              <div style={{ background: '#0a0e1a', border: '1px solid #1e2a3a', borderRadius: 8, padding: '14px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 9, letterSpacing: 2, color: '#4a5568' }}>ACTIVE TASKS</span>
                  <span style={{ fontSize: 9, color: '#C49A6C', background: '#1f1810', padding: '2px 10px', borderRadius: 10 }}>{openTasks} OPEN</span>
                </div>
                {tasks.map((t, i) => (
                  <TaskRow key={i} task={t} index={i} onToggle={toggleTask} />
                ))}
              </div>

              <AiPanel title="TASK ASSISTANT" output={taskOutput} loading={taskLoading}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <textarea
                    value={taskQ}
                    onChange={e => setTaskQ(e.target.value)}
                    placeholder="Ask Claude to prioritize your list, draft a task plan, or help with a specific item…"
                    style={{ ...inputStyle, flex: 1, resize: 'none', height: 48 }}
                  />
                  <button onClick={runTaskAI} disabled={taskLoading} style={{ ...buttonStyle, opacity: taskLoading ? 0.6 : 1 }}>
                    {taskLoading ? '…' : 'ASK ▶'}
                  </button>
                </div>
              </AiPanel>
            </>
          )}

          {/* ── CODEX SYNC ──────────────────────────────────────── */}
          {tab === 'codex' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 9, letterSpacing: 2, color: '#4a5568' }}>CODEX SYNC LOG</span>
                <span style={{ fontSize: 9, color: '#60a5fa', background: '#10233a', padding: '2px 10px', borderRadius: 10 }}>LATIMORE HUB OS</span>
              </div>

              <div style={{ background: '#02050a', border: '1px solid #1e2a3a', borderRadius: 8, padding: 12, fontFamily: 'monospace', fontSize: 11, lineHeight: 2, maxHeight: 160, overflowY: 'auto' }}>
                {LOGS.map((l, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12 }}>
                    <span style={{ color: '#C49A6C', flexShrink: 0 }}>[{l.time}]</span>
                    <span style={{ color: l.cls }}>{l.msg}</span>
                  </div>
                ))}
              </div>

              <div>
                <div style={{ fontSize: 9, letterSpacing: 2, color: '#4a5568', marginBottom: 10 }}>CODEX WORKFLOWS — RUN WITH CLAUDE</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <WorkflowCard icon="◇" title="Codebase audit" desc="Scan Hub OS for broken routes, missing env vars, and deploy issues." onClick={() => launchWorkflow('audit')} />
                  <WorkflowCard icon="⌥" title="Termux deploy" desc="Ready-to-paste git + Vercel deploy commands for Android Termux sessions." onClick={() => launchWorkflow('deploy')} />
                  <WorkflowCard icon="◈" title="Supabase health check" desc="Audit CRM tables, admin routes, and Prisma schema." onClick={() => launchWorkflow('supabase')} />
                  <WorkflowCard icon="▦" title="Generate admin page" desc="Build a new Hub OS page — leads, CRM, docs, or strategy." onClick={() => launchWorkflow('admin-page')} />
                </div>
              </div>

              <AiPanel title="CODEX / CLAUDE INTEGRATED PROMPT" output={codexOutput} loading={codexLoading}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <textarea
                    value={codexQ}
                    onChange={e => setCodexQ(e.target.value)}
                    placeholder="e.g. Generate a Next.js CRM lead table component that pulls from Supabase leads table, sorted by county…"
                    style={{ ...inputStyle, flex: 1, resize: 'none', height: 56 }}
                  />
                  <button onClick={runCodexAI} disabled={codexLoading} style={{ ...buttonStyle, opacity: codexLoading ? 0.6 : 1 }}>
                    {codexLoading ? 'RUNNING…' : 'RUN ▶'}
                  </button>
                </div>
              </AiPanel>
            </>
          )}
        </div>
      </div>

      {/* STATUS TICKER */}
      <div style={{ background: '#020508', borderTop: '1px solid #0f1a0a', padding: '6px 16px', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <Ticker />
      </div>
    </div>
  )
}

// ── Shared sub-component ──────────────────────────────────────────────────────

function TaskRow({ task, index, onToggle }: { task: Task; index: number; onToggle: (i: number) => void }) {
  const c = PRI_COLORS[task.pri]
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: '1px solid #1e2a3a' }}>
      <button
        onClick={() => onToggle(index)}
        style={{
          marginTop: 2, width: 16, height: 16, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, border: `1px solid ${task.done ? '#C49A6C' : '#334155'}`,
          background: task.done ? '#C49A6C' : 'transparent', cursor: 'pointer',
        }}
      >
        {task.done && <span style={{ fontSize: 10, color: '#000', fontWeight: 900 }}>✓</span>}
      </button>
      <div style={{ flex: 1, fontSize: 11, lineHeight: 1.5, color: task.done ? '#4a5568' : '#94a3b8', textDecoration: task.done ? 'line-through' : 'none' }}>
        {task.text}
      </div>
      <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 8, flexShrink: 0, background: c.bg, color: c.text }}>
        {task.pri.toUpperCase()}
      </span>
    </div>
  )
}
