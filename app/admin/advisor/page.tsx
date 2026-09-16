import Link from 'next/link'
import { BarChart3, BookOpenCheck, ClipboardList, MessageSquareText, Presentation } from 'lucide-react'
import { COLORS } from '@/lib/brand'

const tools = [
  {
    href: '/admin/advisor/pfr',
    title: 'Personal Financial Review',
    description: 'Structured client discovery, protection gap, retirement context, priorities, and persistent intake records.',
    icon: ClipboardList,
    label: 'Client Discovery',
  },
  {
    href: '/admin/advisor/appointment-guide',
    title: 'Appointment Guide',
    description: 'The complete 16-step PFR appointment framework rebuilt as a Latimore-only, carrier-neutral guided workflow.',
    icon: Presentation,
    label: 'Appointment Flow',
  },
  {
    href: '/admin/advisor/knowledge-center',
    title: 'Knowledge Center',
    description: 'Carrier-neutral advisor training across protection, retirement income, business protection, and compliance concepts.',
    icon: BookOpenCheck,
    label: 'Training',
  },
  {
    href: '/admin/advisor/conversation-coach',
    title: 'Conversation Coach',
    description: 'Build an education-first, low-pressure response to a real client concern without carrier or proprietary product language.',
    icon: MessageSquareText,
    label: 'Coaching',
  },
  {
    href: '/analytics',
    title: 'Tracking Command Center',
    description: 'See first-party traffic, tool starts, completions, CTA activity, booking clicks, leads, appointments, and recent events.',
    icon: BarChart3,
    label: 'Measurement',
  },
]

export default function AdvisorWorkspacePage() {
  return (
    <div className="mx-auto max-w-7xl p-5 md:p-8">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.26em]" style={{ color: COLORS.gold }}>Latimore Advisor OS</p>
        <h1 className="mt-2 text-3xl font-black text-white md:text-4xl">Advisor Workspace</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6" style={{ color: COLORS.inkMuted }}>
          One operating layer for client discovery, appointment execution, advisor training, conversation coaching, and measurable outcomes. The workspace remains Latimore-branded and carrier-neutral.
        </p>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {tools.map((tool) => {
          const Icon = tool.icon
          return (
            <Link key={tool.href} href={tool.href} className="group rounded-2xl border border-white/10 bg-white/[0.035] p-6 no-underline transition hover:-translate-y-0.5 hover:border-[#C9A25F]/60">
              <div className="flex items-start justify-between gap-4">
                <div className="rounded-xl p-3" style={{ background: 'rgba(201,162,95,.12)', color: COLORS.goldLight }}><Icon size={24} /></div>
                <span className="rounded-full px-3 py-1.5 text-xs font-black" style={{ background: 'rgba(255,255,255,.06)', color: COLORS.inkMuted }}>{tool.label}</span>
              </div>
              <h2 className="mt-5 text-2xl font-black text-white">{tool.title}</h2>
              <p className="mt-3 text-sm leading-7" style={{ color: COLORS.inkMuted }}>{tool.description}</p>
              <div className="mt-5 text-sm font-black" style={{ color: COLORS.goldLight }}>Open tool →</div>
            </Link>
          )
        })}
      </div>

      <div className="mt-8 rounded-2xl border p-6" style={{ borderColor: 'rgba(201,162,95,.22)', background: 'rgba(201,162,95,.06)' }}>
        <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: COLORS.goldLight }}>Operating rule</p>
        <p className="mt-2 text-sm leading-6 text-white/75">Every new Latimore page, assessment, workflow, CTA, QR journey, and advisor tool must ship with first-party event tracking. Client-facing experiences do not use carrier names, carrier logos, or proprietary product names.</p>
      </div>
    </div>
  )
}
