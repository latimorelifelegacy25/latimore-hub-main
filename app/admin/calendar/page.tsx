export const dynamic = 'force-dynamic'

import { CalendarDays } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import PageHeader from '../_components/PageHeader'
import AdminCard from '../_components/AdminCard'
import EmptyState from '../_components/EmptyState'
import StatPill from '../_components/StatPill'
import { countAll } from '@/lib/prisma-helpers'

function fmtDate(value?: Date | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(value)
}

function displayName(contact: { fullName?: string | null; firstName?: string | null; lastName?: string | null; email?: string | null; phone?: string | null }) {
  return contact.fullName || [contact.firstName, contact.lastName].filter(Boolean).join(' ') || contact.email || contact.phone || 'Unknown Contact'
}

export default async function CalendarPage() {
  const [events, counts] = await Promise.all([
    prisma.calendarEvent.findMany({ orderBy: { startAt: 'asc' }, take: 40, include: { contact: true, inquiry: true } }),
    prisma.calendarEvent.groupBy({ by: ['status'], _count: { _all: true } }),
  ])

  return (
    <div className="p-6 md:p-8">
      <PageHeader eyebrow="Scheduling OS" title="Calendar" description="Synced events, appointment workflow state, and contact-linked meeting activity." />
      <div className="mb-4 flex flex-wrap gap-2">{counts.map((row) => <StatPill key={row.status} label={row.status} value={countAll(row._count)} />)}</div>
      <AdminCard title="Upcoming and recent calendar events">
        {events.length === 0 ? <EmptyState title="No calendar events yet" description="Connect Calendly and send webhook traffic to /api/calendar/calendly/webhook." icon={<CalendarDays size={18} />} /> : <div className="space-y-3">{events.map((event) => <div key={event.id} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4"><div className="mb-3 flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold text-white">{event.title}</p><p className="mt-1 text-xs text-[#A9B1BE]">{event.contact ? displayName(event.contact) : 'Unlinked contact'} · {event.provider}</p></div><div className="flex flex-wrap gap-2"><StatPill label="Status" value={event.status} /><StatPill label="Stage" value={event.inquiry?.stage ?? '—'} /></div></div><div className="grid gap-2 text-sm text-[#D7DCE5] md:grid-cols-2"><div>Start: {fmtDate(event.startAt)}</div><div>End: {fmtDate(event.endAt)}</div><div>Timezone: {event.timezone ?? '—'}</div><div>Meeting URL: {event.meetingUrl ?? '—'}</div></div></div>)}</div>}
      </AdminCard>
    </div>
  )
}
