import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { requireAgentRole } from '@/lib/rbac'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function RecruitingPage() {
  const auth = await requireAgentRole()
  if (!auth.ok) redirect('/api/auth/signin?callbackUrl=/admin/recruiting')
  const [applications, total, views, starts, booked, requested] = await Promise.all([
    prisma.joinApplication.findMany({ orderBy: { createdAt: 'desc' }, take: 100, include: { events: { orderBy: { createdAt: 'desc' } } } }),
    prisma.joinApplication.count(),
    prisma.joinFormEvent.groupBy({ by: ['leadSessionId'], where: { eventType: 'join_form_viewed', leadSessionId: { not: null } } }),
    prisma.joinFormEvent.groupBy({ by: ['leadSessionId'], where: { eventType: 'join_form_started', leadSessionId: { not: null } } }),
    prisma.joinApplication.count({ where: { status: 'Intro Call Booked' } }),
    prisma.joinApplication.count({ where: { status: 'Intro Call Requested' } }),
  ])
  return <main className="min-w-0 flex-1 p-4 sm:p-8">
    <h1 className="text-3xl font-bold">Recruiting Applicants</h1>
    <p className="mt-2 text-slate-400">Join Our Team · form activity, applicant details, attribution, and introductory conversations.</p>
    <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
      {[['Form visitors', views.length], ['Form starts', starts.length], ['Applications', total], ['Calls booked', booked], ['Call requests', requested]].map(([label, value]) => <div key={label} className="rounded-xl border border-white/10 p-4"><p className="text-sm text-slate-400">{label}</p><p className="mt-2 text-3xl font-bold text-[#C49A6C]">{value}</p></div>)}
    </div>
    <p className="mt-5 text-sm text-slate-400">All-time totals. Showing the latest 100 applications. Poster QR attribution: join_team_poster / qr / join-team.</p>
    <div className="mt-5 overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-left text-sm"><thead className="bg-[#2C3E50] text-white"><tr>{['Submitted', 'Applicant', 'Licensing', 'Source', 'Status / call time', 'Details'].map((label) => <th key={label} className="p-3">{label}</th>)}</tr></thead><tbody>
        {applications.map((application) => <tr key={application.id} className="border-t border-white/10 align-top odd:bg-white/5">
          <td className="whitespace-nowrap p-3">{application.createdAt.toLocaleDateString('en-US', { timeZone: 'America/New_York' })}</td>
          <td className="p-3"><Link className="font-semibold underline" href={`/admin/contacts/${application.contactId}`}>{application.fullName}</Link><p>{application.email}</p><p>{application.phone}</p><p>{application.cityState}</p></td>
          <td className="p-3">{application.licenseStatus}</td>
          <td className="p-3">{application.source === 'join_team_poster' && application.medium === 'qr' ? 'Join Our Team — Poster QR' : application.source}<p className="text-xs text-slate-400">{application.medium} / {application.campaign}</p></td>
          <td className="p-3">{application.status}<p className="mt-1 text-slate-400">{application.preferredCallTime}</p><Link className="mt-2 inline-block underline" href="/admin/tasks">Follow-up tasks</Link></td>
          <td className="p-3"><details><summary className="cursor-pointer text-[#C49A6C]">Full application</summary><dl className="mt-3 min-w-64 space-y-2">{Object.entries(application).filter(([key]) => key !== 'events').map(([key, value]) => <div key={key}><dt className="font-semibold">{key}</dt><dd className="break-words text-slate-300">{Array.isArray(value) ? value.join(', ') : value instanceof Date ? value.toISOString() : String(value ?? 'Not provided')}</dd></div>)}</dl><h3 className="mt-4 font-bold">Application activity</h3>{application.events.map((event) => <p key={event.id} className="mt-1 text-xs">{event.eventType} · {event.createdAt.toISOString()}</p>)}</details></td>
        </tr>)}
        {!applications.length && <tr><td colSpan={6} className="p-6 text-center text-slate-400">No recruiting applications yet.</td></tr>}
      </tbody></table>
    </div>
  </main>
}
