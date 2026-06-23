'use client'

import { useEffect, useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Code2,
  Copy,
  Database,
  FileText,
  FolderOpen,
  GitBranch,
  Globe,
  HardDrive,
  LayoutDashboard,
  Loader2,
  Rocket,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Terminal,
  User,
  Wand2,
} from 'lucide-react'

type TabKey = 'dashboard' | 'revenue' | 'tasks' | 'drive' | 'codex'

type Task = {
  text: string
  priority: 'high' | 'medium' | 'low'
  done: boolean
}

type AiMode = 'chat' | 'strategy'

type AgentAction =
  | { type: 'web_search'; queries: string[]; sources: string[] }
  | { type: 'execute_js'; code: string; result: string }
  | { type: 'read_file'; filePath: string; preview: string }

type AgentMessage = {
  role: 'user' | 'assistant'
  text: string
  actions?: AgentAction[]
}

type AgentToolConfig = { webSearch: boolean; code: boolean; files: boolean }

const defaultTasks: Task[] = [
  { text: 'Review PAHS QR funnel and confirm sponsor traffic route', priority: 'high', done: false },
  { text: 'Follow up on Schuylkill Chamber opportunity and next-step documents', priority: 'high', done: false },
  { text: 'Audit Latimore Hub admin tabs after latest deployment', priority: 'medium', done: false },
  { text: 'Prepare next education-first FIA/IUL content sequence', priority: 'medium', done: false },
  { text: 'Confirm analytics events for booking, call, and lead capture flows', priority: 'low', done: false },
]

const tabs: Array<{ key: TabKey; label: string; icon: LucideIcon }> = [
  { key: 'dashboard', label: 'Command', icon: LayoutDashboard },
  { key: 'revenue', label: 'Revenue', icon: Target },
  { key: 'tasks', label: 'Tasks', icon: CheckCircle2 },
  { key: 'drive', label: 'Drive', icon: HardDrive },
  { key: 'codex', label: 'Codex', icon: Terminal },
]

const metricCards = [
  { label: 'Pipeline Focus', value: '10-stage CRM', detail: 'New Lead → In Force + Review', icon: GitBranch },
  { label: 'Content Engine', value: 'Brand-locked', detail: 'Education-first, no fear language', icon: ShieldCheck },
  { label: 'AI Routing', value: 'Server-side', detail: '/api/admin/ai/chat', icon: Bot },
  { label: 'Workspace', value: 'Native Next', detail: 'No React 19 bundle conflict', icon: Rocket },
]

const quickPrompts = [
  'Create a Schuylkill County mortgage protection follow-up script for a young family.',
  'Turn the Rule of 72 into a simple Facebook post for pre-retirees.',
  'Build a PAHS sponsor follow-up message that is community-first and not salesy.',
  'Give me the next 5 tasks to move a lead from Booked Call to Options Presented.',
]

async function callNexusAgent(message: string, mode: AiMode = 'chat') {
  const response = await fetch('/api/admin/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, mode }),
  })

  const data = await response.json()
  if (!response.ok) throw new Error(data?.error || 'Nexus Agent request failed')
  return typeof data.data === 'string' ? data.data : JSON.stringify(data.data, null, 2)
}

async function callAgentMode(message: string, history: AgentMessage[], tools: AgentToolConfig) {
  const response = await fetch('/api/admin/ai/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      history: history.map((m) => ({ role: m.role, text: m.text })),
      tools,
    }),
  })

  const data = await response.json()
  if (!response.ok) throw new Error(data?.error || 'Agent mode request failed')
  return { text: data.reply as string, actions: (data.actions ?? []) as AgentAction[] }
}

function AgentActionLog({ action }: { action: AgentAction }) {
  const [isOpen, setIsOpen] = useState(false)
  const label =
    action.type === 'execute_js'
      ? 'Executed sandboxed JavaScript'
      : action.type === 'web_search'
        ? `Web search: ${action.queries[0] ?? ''}`
        : `Read file: ${action.filePath}`
  const Icon = action.type === 'execute_js' ? Code2 : action.type === 'web_search' ? Globe : FileText

  return (
    <div className="mb-2 overflow-hidden rounded-xl border border-white/10 bg-black/30">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-bold text-[#A9B1BE] hover:text-white"
      >
        <span className="flex items-center gap-2"><Icon size={14} className="text-[#C9A25F]" />{label}</span>
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {isOpen && (
        <div className="border-t border-white/10 bg-black/40 p-3 text-xs font-mono text-[#A9B1BE]">
          {action.type === 'execute_js' && (
            <>
              <pre className="mb-2 whitespace-pre-wrap text-[#E8EDF5]">{action.code}</pre>
              <pre className="whitespace-pre-wrap text-emerald-300">{action.result}</pre>
            </>
          )}
          {action.type === 'web_search' && (
            <ul className="space-y-1">
              {action.sources.map((src) => (
                <li key={src} className="truncate text-[#E8EDF5]">{src}</li>
              ))}
              {action.sources.length === 0 && <li>No sources returned.</li>}
            </ul>
          )}
          {action.type === 'read_file' && (
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap text-[#E8EDF5]">{action.preview}</pre>
          )}
        </div>
      )}
    </div>
  )
}

function PriorityBadge({ priority }: { priority: Task['priority'] }) {
  const classes = {
    high: 'border-red-400/30 bg-red-500/10 text-red-200',
    medium: 'border-amber-400/30 bg-amber-500/10 text-amber-200',
    low: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
  }
  return <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${classes[priority]}`}>{priority}</span>
}

export default function NexusAgentClient() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard')
  const [tasks, setTasks] = useState<Task[]>(defaultTasks)
  const [prompt, setPrompt] = useState(quickPrompts[0])
  const [output, setOutput] = useState('Nexus Agent is ready. Choose a workflow, enter a command, and generate a brand-locked action plan.')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [revenuePersona, setRevenuePersona] = useState('Pre-retirees in Schuylkill County')
  const [revenueAsset, setRevenueAsset] = useState('Facebook + LinkedIn content pack')
  const [driveBrief, setDriveBrief] = useState('Summarize what should be in the PAHS campaign folder and which assets need cleanup.')
  const [codexBrief, setCodexBrief] = useState('Review the Latimore Hub admin experience and list the next safest code improvements.')
  const [agentTools, setAgentTools] = useState<AgentToolConfig>({ webSearch: true, code: true, files: true })
  const [agentMessages, setAgentMessages] = useState<AgentMessage[]>([])
  const [agentInput, setAgentInput] = useState('')
  const [agentLoading, setAgentLoading] = useState(false)
  const [agentError, setAgentError] = useState<string | null>(null)

  useEffect(() => {
    const saved = window.localStorage.getItem('latimore-nexus-tasks')
    if (!saved) return
    try {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) setTasks(parsed)
    } catch {
      window.localStorage.removeItem('latimore-nexus-tasks')
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem('latimore-nexus-tasks', JSON.stringify(tasks))
  }, [tasks])

  const completeCount = useMemo(() => tasks.filter((task) => task.done).length, [tasks])

  const runAgent = async (message: string, mode: AiMode = 'chat') => {
    setLoading(true)
    setError(null)
    try {
      const result = await callNexusAgent(message, mode)
      setOutput(result)
    } catch (err) {
      const fallback = err instanceof Error ? err.message : 'Unknown error'
      setError(fallback)
      setOutput('Fallback mode: the interface is live, but the server-side AI route returned an error. Check provider keys, admin auth, and /api/admin/ai/chat logs in Vercel.')
    } finally {
      setLoading(false)
    }
  }

  const copyOutput = async () => {
    await navigator.clipboard.writeText(output)
  }

  const addTask = (text: string, priority: Task['priority'] = 'medium') => {
    if (!text.trim()) return
    setTasks((prev) => [{ text: text.trim(), priority, done: false }, ...prev])
  }

  const toggleAgentTool = (key: keyof AgentToolConfig) => {
    setAgentTools((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const sendAgentMessage = async () => {
    const text = agentInput.trim()
    if (!text || agentLoading) return
    setAgentInput('')
    setAgentError(null)
    setAgentLoading(true)
    const history = agentMessages
    setAgentMessages((prev) => [...prev, { role: 'user', text }])
    try {
      const { text: reply, actions } = await callAgentMode(text, history, agentTools)
      setAgentMessages((prev) => [...prev, { role: 'assistant', text: reply, actions }])
    } catch (err) {
      const fallback = err instanceof Error ? err.message : 'Unknown error'
      setAgentError(fallback)
      setAgentMessages((prev) => [...prev, { role: 'assistant', text: `Agent mode error: ${fallback}` }])
    } finally {
      setAgentLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0E1420]/85 shadow-2xl shadow-black/30">
          <div className="relative p-6 md:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,162,95,0.20),transparent_34%)]" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#C9A25F]/30 bg-[#C9A25F]/10 px-3 py-1 text-xs font-black uppercase tracking-[0.25em] text-[#E7C986]">
                  <Sparkles size={14} /> Nexus Agent Workspace
                </div>
                <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">Latimore Hub OS command layer</h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-[#A9B1BE] md:text-base">
                  Native admin workspace for revenue content, task execution, Drive planning, and code-ops strategy. Built into the existing Next.js admin shell so the production app stays stable.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[#A9B1BE]">Tasks complete</p>
                  <p className="mt-1 text-2xl font-black text-white">{completeCount}/{tasks.length}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[#A9B1BE]">AI status</p>
                  <p className="mt-1 text-2xl font-black text-[#E7C986]">Live</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((card) => {
            const Icon = card.icon
            return (
              <div key={card.label} className="rounded-2xl border border-white/10 bg-[#111827]/80 p-5 shadow-xl shadow-black/20">
                <div className="flex items-center justify-between">
                  <Icon className="text-[#C9A25F]" size={22} />
                  <Activity className="text-emerald-300" size={16} />
                </div>
                <p className="mt-4 text-xs uppercase tracking-[0.18em] text-[#A9B1BE]">{card.label}</p>
                <p className="mt-1 text-xl font-black text-white">{card.value}</p>
                <p className="mt-1 text-sm text-[#A9B1BE]">{card.detail}</p>
              </div>
            )
          })}
        </section>

        <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
          <aside className="rounded-3xl border border-white/10 bg-[#0E1420]/90 p-3 xl:sticky xl:top-6 xl:self-start">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const selected = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`mb-2 flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-bold transition ${
                    selected ? 'bg-[#C9A25F] text-[#101826]' : 'text-[#A9B1BE] hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-3"><Icon size={18} />{tab.label}</span>
                  <ChevronRight size={16} />
                </button>
              )
            })}
          </aside>

          <main className="space-y-6">
            {activeTab === 'dashboard' && (
              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <section className="rounded-3xl border border-white/10 bg-[#0E1420]/90 p-5 md:p-6">
                  <div className="flex items-center gap-3">
                    <Bot className="text-[#C9A25F]" />
                    <div>
                      <h2 className="text-xl font-black text-white">Agent command</h2>
                      <p className="text-sm text-[#A9B1BE]">Send direct instructions to the existing server-side AI route.</p>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {quickPrompts.map((item) => (
                      <button key={item} onClick={() => setPrompt(item)} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-[#A9B1BE] hover:border-[#C9A25F]/50 hover:text-white">
                        {item.slice(0, 54)}{item.length > 54 ? '…' : ''}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    rows={6}
                    className="mt-5 w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white outline-none focus:border-[#C9A25F]/60"
                  />
                  <button onClick={() => runAgent(prompt)} disabled={loading} className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#C9A25F] px-5 py-3 text-sm font-black text-[#101826] transition hover:brightness-110 disabled:opacity-60">
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />} Run Nexus Agent
                  </button>
                </section>

                <section className="rounded-3xl border border-white/10 bg-[#0E1420]/90 p-5 md:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-black text-white">Output</h2>
                      <p className="text-sm text-[#A9B1BE]">Copy-ready response window.</p>
                    </div>
                    <button onClick={copyOutput} className="rounded-xl border border-white/10 p-2 text-[#A9B1BE] hover:text-white" aria-label="Copy output"><Copy size={16} /></button>
                  </div>
                  {error && <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-100">{error}</div>}
                  <pre className="mt-4 max-h-[520px] overflow-auto whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-[#E8EDF5]">{output}</pre>
                </section>
              </div>
            )}

            {activeTab === 'revenue' && (
              <section className="rounded-3xl border border-white/10 bg-[#0E1420]/90 p-5 md:p-6">
                <div className="flex items-center gap-3"><Target className="text-[#C9A25F]" /><h2 className="text-xl font-black text-white">Revenue content engine</h2></div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm text-[#A9B1BE]">Persona / market
                    <input value={revenuePersona} onChange={(event) => setRevenuePersona(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-white outline-none focus:border-[#C9A25F]/60" />
                  </label>
                  <label className="space-y-2 text-sm text-[#A9B1BE]">Asset type
                    <input value={revenueAsset} onChange={(event) => setRevenueAsset(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-white outline-none focus:border-[#C9A25F]/60" />
                  </label>
                </div>
                <button
                  onClick={() => runAgent(`Generate a ${revenueAsset} for ${revenuePersona}. Use Latimore Life & Legacy brand voice, local Coal Region relevance, education-first language, a clear CTA, the tagline Protecting Today. Securing Tomorrow., and #TheBeatGoesOn.`, 'strategy')}
                  disabled={loading}
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#C9A25F] px-5 py-3 text-sm font-black text-[#101826] disabled:opacity-60"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />} Generate content pack
                </button>
              </section>
            )}

            {activeTab === 'tasks' && (
              <section className="rounded-3xl border border-white/10 bg-[#0E1420]/90 p-5 md:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3"><CheckCircle2 className="text-[#C9A25F]" /><h2 className="text-xl font-black text-white">Execution board</h2></div>
                  <button onClick={() => runAgent(`Review this task board and tell me what to do next:\n${tasks.map((task) => `- [${task.done ? 'x' : ' '}] ${task.priority}: ${task.text}`).join('\n')}`)} className="rounded-2xl border border-[#C9A25F]/40 px-4 py-2 text-sm font-bold text-[#E7C986] hover:bg-[#C9A25F]/10">Ask agent for next move</button>
                </div>
                <div className="mt-5 space-y-3">
                  {tasks.map((task, index) => (
                    <div key={`${task.text}-${index}`} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                      <input type="checkbox" checked={task.done} onChange={() => setTasks((prev) => prev.map((item, i) => i === index ? { ...item, done: !item.done } : item))} className="mt-1 h-4 w-4 accent-[#C9A25F]" />
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-semibold ${task.done ? 'text-[#A9B1BE] line-through' : 'text-white'}`}>{task.text}</p>
                        <div className="mt-2"><PriorityBadge priority={task.priority} /></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
                  <input placeholder="Add a new task…" onKeyDown={(event) => { if (event.key === 'Enter') { addTask(event.currentTarget.value); event.currentTarget.value = '' } }} className="rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-white outline-none focus:border-[#C9A25F]/60" />
                  <button onClick={() => setTasks(defaultTasks)} className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-bold text-[#A9B1BE] hover:text-white">Reset board</button>
                </div>
              </section>
            )}

            {activeTab === 'drive' && (
              <section className="rounded-3xl border border-white/10 bg-[#0E1420]/90 p-5 md:p-6">
                <div className="flex items-center gap-3"><FolderOpen className="text-[#C9A25F]" /><h2 className="text-xl font-black text-white">Drive workspace planner</h2></div>
                <p className="mt-2 text-sm text-[#A9B1BE]">This native module avoids exposing Google tokens client-side. Use it to plan folder structure, asset cleanup, and campaign organization.</p>
                <textarea value={driveBrief} onChange={(event) => setDriveBrief(event.target.value)} rows={5} className="mt-5 w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white outline-none focus:border-[#C9A25F]/60" />
                <button onClick={() => runAgent(`Drive workspace planning request: ${driveBrief}. Return a clean folder structure, missing assets, naming conventions, and next actions.`)} disabled={loading} className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#C9A25F] px-5 py-3 text-sm font-black text-[#101826] disabled:opacity-60"><Database size={18} /> Plan Drive cleanup</button>
              </section>
            )}

            {activeTab === 'codex' && (
              <section className="rounded-3xl border border-white/10 bg-[#0E1420]/90 p-5 md:p-6">
                <div className="flex items-center gap-3"><Code2 className="text-[#C9A25F]" /><h2 className="text-xl font-black text-white">Codex command brief</h2></div>
                <p className="mt-2 text-sm text-[#A9B1BE]">Generate safe implementation instructions for repo updates without overwriting production-critical files.</p>
                <textarea value={codexBrief} onChange={(event) => setCodexBrief(event.target.value)} rows={5} className="mt-5 w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white outline-none focus:border-[#C9A25F]/60" />
                <button onClick={() => runAgent(`Code operations request: ${codexBrief}. Return exact files to edit, risk level, test commands, and deployment notes for latimore-hub-main.`)} disabled={loading} className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#C9A25F] px-5 py-3 text-sm font-black text-[#101826] disabled:opacity-60"><Terminal size={18} /> Generate code brief</button>
              </section>
            )}

            {activeTab === 'codex' && (
              <section className="rounded-3xl border border-white/10 bg-[#0E1420]/90 p-5 md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3"><Bot className="text-[#C9A25F]" /><h2 className="text-xl font-black text-white">Agent mode</h2></div>
                  <div className="flex flex-wrap gap-2">
                    {([
                      ['webSearch', 'Web search', Globe],
                      ['code', 'Sandboxed JS', Code2],
                      ['files', 'Read repo files', FileText],
                    ] as const).map(([key, label, Icon]) => (
                      <button
                        key={key}
                        onClick={() => toggleAgentTool(key)}
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                          agentTools[key] ? 'border-[#C9A25F]/60 bg-[#C9A25F]/15 text-[#E7C986]' : 'border-white/10 text-[#A9B1BE] hover:text-white'
                        }`}
                      >
                        <Icon size={13} /> {label}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="mt-2 text-sm text-[#A9B1BE]">
                  Real tool calls, executed server-side: live web search, a sandboxed JavaScript evaluator (no filesystem/network access inside it), and read-only repo file access. No API keys ever reach the browser.
                </p>

                <div className="mt-5 max-h-[480px] space-y-3 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-4">
                  {agentMessages.length === 0 && (
                    <p className="text-sm text-[#A9B1BE]">Ask the agent something that needs a tool — e.g. "search the web for current term life trends" or "read lib/ai/client.ts and summarize it" or "calculate compound interest on $10,000 at 6% for 20 years".</p>
                  )}
                  {agentMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${msg.role === 'user' ? 'ml-2 bg-[#C9A25F]' : 'mr-2 border border-white/10 bg-black/40'}`}>
                          {msg.role === 'user' ? <User size={14} className="text-[#101826]" /> : <Bot size={14} className="text-[#C9A25F]" />}
                        </div>
                        <div className="min-w-0">
                          {msg.actions?.map((action, ai) => <AgentActionLog key={ai} action={action} />)}
                          <div className={`whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-6 ${msg.role === 'user' ? 'bg-[#C9A25F] text-[#101826]' : 'border border-white/10 bg-[#111827]/80 text-[#E8EDF5]'}`}>
                            {msg.text}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {agentLoading && (
                    <div className="flex items-center gap-2 text-sm text-[#A9B1BE]"><Loader2 size={14} className="animate-spin" /> Working…</div>
                  )}
                </div>

                {agentError && <div className="mt-3 rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-100">{agentError}</div>}

                <div className="mt-4 flex gap-2">
                  <input
                    value={agentInput}
                    onChange={(event) => setAgentInput(event.target.value)}
                    onKeyDown={(event) => { if (event.key === 'Enter') sendAgentMessage() }}
                    placeholder="Ask the agent to search, calculate, or read a file…"
                    disabled={agentLoading}
                    className="flex-1 rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-white outline-none focus:border-[#C9A25F]/60 disabled:opacity-60"
                  />
                  <button onClick={sendAgentMessage} disabled={agentLoading || !agentInput.trim()} className="flex items-center gap-2 rounded-2xl bg-[#C9A25F] px-5 py-3 text-sm font-black text-[#101826] disabled:opacity-60">
                    {agentLoading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                  </button>
                </div>
              </section>
            )}

            {activeTab !== 'dashboard' && (
              <section className="rounded-3xl border border-white/10 bg-[#0E1420]/90 p-5 md:p-6">
                <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-black text-white">Latest Agent Output</h2><button onClick={copyOutput} className="rounded-xl border border-white/10 p-2 text-[#A9B1BE] hover:text-white"><Copy size={16} /></button></div>
                {error && <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-100">{error}</div>}
                <pre className="mt-4 max-h-[520px] overflow-auto whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-[#E8EDF5]">{output}</pre>
              </section>
            )}

            <section className="grid gap-4 md:grid-cols-3">
              {[
                ['Brand lock', 'Protecting Today. Securing Tomorrow. + #TheBeatGoesOn', FileText],
                ['Security', 'Provider calls stay server-side through existing admin API', ShieldCheck],
                ['Deployment', 'No Prisma schema or package changes required', Rocket],
              ].map(([title, body, Icon]) => {
                const CardIcon = Icon as typeof FileText
                return (
                  <div key={title as string} className="rounded-2xl border border-white/10 bg-[#111827]/80 p-4">
                    <CardIcon className="text-[#C9A25F]" size={20} />
                    <p className="mt-3 font-black text-white">{title as string}</p>
                    <p className="mt-1 text-sm text-[#A9B1BE]">{body as string}</p>
                  </div>
                )
              })}
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}
