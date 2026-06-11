import Link from 'next/link'

export function ExecutivePageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}

export function ExecutiveShell({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto max-w-7xl space-y-8 px-6 py-8 text-slate-950">{children}</main>
}

export function KpiCard({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
      {note ? <p className="mt-2 text-xs text-slate-500">{note}</p> : null}
    </section>
  )
}

export function NarrativeInsightCard({ title, summary, action, severity = 'info' }: { title: string; summary: string; action?: string | null; severity?: string }) {
  const tone = severity === 'high' ? 'border-red-200 bg-red-50' : severity === 'medium' ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'
  return (
    <section className={`rounded-xl border p-6 shadow-sm ${tone}`}>
      <p className="text-lg font-medium text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{summary}</p>
      {action ? <p className="mt-4 text-sm font-medium text-slate-900">Next: {action}</p> : null}
    </section>
  )
}

export function ReportStatusBadge({ status }: { status?: string | null }) {
  return <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium capitalize text-slate-700">{status || 'generated'}</span>
}

export function EngagementNav() {
  const items = [
    ['/admin/engagement-dashboard', 'Overview'],
    ['/admin/engagement-dashboard/posts', 'Posts'],
    ['/admin/engagement-dashboard/comments', 'Comments'],
    ['/admin/engagement-dashboard/topics', 'Topics'],
    ['/admin/engagement-dashboard/attribution', 'Attribution'],
    ['/admin/engagement-dashboard/reports', 'Reports'],
  ] as const
  return (
    <nav className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
      {items.map(([href, label]) => (
        <Link key={href} href={href} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-950">
          {label}
        </Link>
      ))}
    </nav>
  )
}

export function EmptyState({ title, detail }: { title: string; detail?: string }) {
  return (
    <section className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <p className="font-medium text-slate-950">{title}</p>
      {detail ? <p className="mt-2 text-sm text-slate-500">{detail}</p> : null}
    </section>
  )
}
