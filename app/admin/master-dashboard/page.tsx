import Link from 'next/link'
import { Activity, Bot, BriefcaseBusiness, ChartNoAxesCombined, FileText, Megaphone, Network, PanelsTopLeft, ShieldCheck, Workflow } from 'lucide-react'
import DailyBrief from '../dashboard/DailyBrief'
import EngagementDashboardClient from '../engagement-dashboard/EngagementDashboardClient'
import { LATIMORE_TOOL_REGISTRY, type LatimoreToolArea } from '@/lib/os/tool-registry'
import { COLORS } from '@/lib/brand'

const areaMeta: Record<LatimoreToolArea, { label: string; icon: typeof Activity }> = {
  client: { label: 'Client Experience', icon: ShieldCheck },
  advisor: { label: 'Advisor Workspace', icon: BriefcaseBusiness },
  crm: { label: 'CRM', icon: PanelsTopLeft },
  marketing: { label: 'Marketing', icon: Megaphone },
  content: { label: 'Content', icon: FileText },
  analytics: { label: 'Analytics', icon: ChartNoAxesCombined },
  automation: { label: 'Automation', icon: Workflow },
  documents: { label: 'Documents', icon: FileText },
  integrations: { label: 'Integrations', icon: Network },
}

const operatingAreas: LatimoreToolArea[] = ['advisor', 'crm', 'marketing', 'content', 'analytics', 'automation', 'documents', 'integrations']

export default function MasterDashboardPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 p-5 md:p-8">
      <header>
        <p className="text-xs font-black uppercase tracking-[0.28em]" style={{ color: COLORS.gold }}>Latimore OS</p>
        <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black text-white md:text-4xl">Command Center</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6" style={{ color: COLORS.inkMuted }}>
              One workspace for client planning, advisor operations, CRM, content, automation, documents, integrations, and measurable outcomes.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black text-emerald-300">
            <Activity size={14} /> Latimore operating layer
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { href: '/admin/advisor', label: 'Advisor Workspace', detail: 'PFR · Appointment Guide · Knowledge · Coaching', icon: BriefcaseBusiness },
          { href: '/analytics', label: 'Tracking Command Center', detail: 'Visitors · Tools · Leads · Appointments · Conversion', icon: ChartNoAxesCombined },
          { href: '/admin/workflow-runs', label: 'Workflow Operations', detail: 'Runs · Compliance · Cost · Audit · Failures', icon: Workflow },
          { href: '/admin/nexus-agent', label: 'Latimore Automation', detail: 'Agent runtime · Tools · Workflow execution', icon: Bot },
        ].map(card => {
          const Icon = card.icon
          return (
            <Link key={card.href} href={card.href} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 no-underline transition hover:-translate-y-0.5 hover:border-[#C9A25F]/50">
              <Icon size={22} style={{ color: COLORS.goldLight }} />
              <h2 className="mt-4 text-lg font-black text-white">{card.label}</h2>
              <p className="mt-2 text-xs leading-5" style={{ color: COLORS.inkMuted }}>{card.detail}</p>
            </Link>
          )
        })}
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <PanelsTopLeft size={18} style={{ color: COLORS.goldLight }} />
          <h2 className="text-xl font-black text-white">Operating Workspaces</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {operatingAreas.map(area => {
            const meta = areaMeta[area]
            const Icon = meta.icon
            const tools = LATIMORE_TOOL_REGISTRY.filter(tool => tool.area === area && tool.requiresAuth)
            if (!tools.length) return null
            return (
              <article key={area} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl p-2.5" style={{ background: 'rgba(201,162,95,.12)', color: COLORS.goldLight }}><Icon size={18} /></div>
                  <div>
                    <h3 className="font-black text-white">{meta.label}</h3>
                    <p className="text-xs" style={{ color: COLORS.inkMuted }}>{tools.length} registered tool{tools.length === 1 ? '' : 's'}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {tools.map(tool => (
                    <Link key={tool.id} href={tool.href} className="flex items-start justify-between gap-4 rounded-xl border border-white/6 bg-black/10 px-3.5 py-3 no-underline transition hover:border-white/15 hover:bg-white/[0.035]">
                      <div>
                        <p className="text-sm font-bold text-white">{tool.name}</p>
                        <p className="mt-1 text-xs leading-5" style={{ color: COLORS.inkMuted }}>{tool.description}</p>
                      </div>
                      <span className="mt-0.5 rounded-full border border-white/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white/50">{tool.status}</span>
                    </Link>
                  ))}
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 md:p-6">
        <h2 className="text-xl font-black text-white">Daily Brief & Operations</h2>
        <div className="mt-5"><DailyBrief /></div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 md:p-6">
        <h2 className="text-xl font-black text-white">Engagement & Activity</h2>
        <div className="mt-5"><EngagementDashboardClient /></div>
      </section>
    </main>
  )
}
