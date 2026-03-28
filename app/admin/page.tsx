export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { AlertTriangle, Bot, Clock3, KanbanSquare, MessageSquareText, Users } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import PageHeader from './_components/PageHeader'
import AdminCard from './_components/AdminCard'
import StatPill from './_components/StatPill'
import EmptyState from './_components/EmptyState'
import { countAll } from '@/lib/prisma-helpers'

function fmtDate(value?: Date | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(value)
}

function displayName(contact: { fullName?: string | null; firstName?: string | null; lastName?: string | null; email?: string | null; phone?: string | null }) {
  return contact.fullName || [contact.firstName, contact.lastName].filter(Boolean).join(' ') || contact.email || contact.phone || 'Unknown Contact'
}

export default async function AdminOverviewPage() {
  const now = new Date()
  const [contactCount, openTaskCount, overdueTaskCount, hotContacts, pipelineCounts, latestAiRun] = await Promise.all([
    prisma.contact.count(),
    prisma.task.count({ where: { status: { in: ['Open', 'In_Progress', 'Snoozed'] } } }),
    prisma.task.count({ where: { dueAt: { lt: now }, status: { in: ['Open', 'In_Progress', 'Snoozed'] } } }),
    prisma.contact.findMany({ take: 8, orderBy: [{ leadScore: 'desc' }, { lastActivityAt: 'desc' }], include: { inquiries: { orderBy: { updatedAt: 'desc' }, take: 1 } } }),
    prisma.inquiry.groupBy({ by: ['stage'], _count: { _all: true } }),
    prisma.aiRun.findFirst({ where: { type: 'daily_brief', status: 'succeeded' }, orderBy: { createdAt: 'desc' } }),
  ])

  const dailyBrief = latestAiRun?.output as any

  return (
    <div className="p-6 md:p-8">
      <PageHeader
        eyebrow="Latimore Hub OS"
        title="Business Operating Dashboard"
        description="Unified view of contacts, pipeline activity, follow-up work, and AI guidance."
        actions={
          <>
            <Link href="/admin/ai-advisor" className="inline-flex items-center gap-2 rounded-xl border border-[#C9A25F]/25 bg-[#C9A25F]/10 px-4 py-2 text-sm font-medium text-[#F4E6C5] transition hover:bg-[#C9A25F]/15">
              <Bot size={16} /> AI Advisor
            </Link>
            <Link href="/admin/pipeline" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">
              <KanbanSquare size={16} /> Open Pipeline
            </Link>
          </>
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminCard className="bg-[#121B2A]"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.2em] text-[#A9B1BE]">Contacts</p><p className="mt-2 text-3xl font-bold text-white">{contactCount}</p></div><Users className="text-[#C9A25F]" /></div></AdminCard>
        <AdminCard className="bg-[#121B2A]"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.2em] text-[#A9B1BE]">Open Tasks</p><p className="mt-2 text-3xl font-bold text-white">{openTaskCount}</p></div><Clock3 className="text-[#C9A25F]" /></div></AdminCard>
        <AdminCard className="bg-[#121B2A]"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.2em] text-[#A9B1BE]">Overdue</p><p className="mt-2 text-3xl font-bold text-white">{overdueTaskCount}</p></div><AlertTriangle className="text-[#C9A25F]" /></div></AdminCard>
        <AdminCard className="bg-[#121B2A]"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.2em] text-[#A9B1BE]">Threads</p><p className="mt-2 text-3xl font-bold text-white">CRM</p></div><MessageSquareText className="text-[#C9A25F]" /></div></AdminCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.45fr,1fr]">
        <AdminCard title="Hot leads" subtitle="Highest-priority contacts based on lead score and recent activity.">
          {hotContacts.length === 0 ? <EmptyState title="No contacts yet" description="Lead and client records will appear here once captured." /> : <div className="space-y-3">{hotContacts.map((contact) => {
            const inquiry = contact.inquiries[0]
            return <div key={contact.id} className="flex flex-col gap-3 rounded-2xl border border-white/8 bg-white/[0.02] p-4 md:flex-row md:items-center md:justify-between">
              <div><p className="text-sm font-semibold text-white">{displayName(contact)}</p><p className="mt-1 text-xs text-[#A9B1BE]">{inquiry?.productInterest ?? 'General'} · {contact.primarySource ?? 'Unknown source'}</p><p className="mt-2 text-xs text-[#8F98A8]">Last activity: {fmtDate(contact.lastActivityAt)}</p></div>
              <div className="flex flex-wrap items-center gap-2"><StatPill label="Score" value={contact.leadScore} tone={contact.leadScore >= 80 ? 'good' : contact.leadScore >= 60 ? 'warn' : 'default'} /><StatPill label="Stage" value={inquiry?.stage ?? '—'} /></div>
            </div>
          })}</div>}
        </AdminCard>

        <AdminCard title="Daily AI brief" subtitle="Latest generated advisor summary from the Legacy AI Advisor.">
          {!dailyBrief?.brief ? <EmptyState title="No daily brief yet" description="Run /api/ai/daily-brief to populate this card." icon={<Bot size={18} />} /> : <div className="space-y-4">
            <div className="rounded-2xl border border-[#C9A25F]/15 bg-[#C9A25F]/5 p-4"><p className="text-sm leading-6 text-[#F7F7F5]">{dailyBrief.brief.summary ?? 'No summary available.'}</p></div>
            <div className="space-y-2">{(dailyBrief.brief.recommendedFocus ?? []).slice(0, 4).map((item: string, index: number) => <div key={index} className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2 text-sm text-white">{item}</div>)}</div>
          </div>}
        </AdminCard>
      </div>

      <div className="mt-4">
        <AdminCard title="Pipeline distribution" subtitle="Current spread across inquiry stages.">
          {pipelineCounts.length === 0 ? <EmptyState title="No inquiries yet" description="Lead pipeline stage data will populate here." icon={<KanbanSquare size={18} />} /> : <div className="space-y-3">{pipelineCounts.map((row) => <div key={row.stage} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4"><div className="mb-2 flex items-center justify-between"><p className="text-sm font-medium text-white">{row.stage}</p><p className="text-sm font-semibold text-[#C9A25F]">{countAll(row._count)}</p></div><div className="h-2 rounded-full bg-white/6"><div className="h-2 rounded-full bg-[#C9A25F]" style={{ width: `${Math.min(100, countAll(row._count) * 12)}%` }} /></div></div>)}</div>}
        </AdminCard>
      </div>
    </div>
  )
}
