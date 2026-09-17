import Link from 'next/link'
import PageHeader from '@/app/admin/_components/PageHeader'
import { getHotVisitors } from '@/lib/hub/visitor-intent'

export const dynamic = 'force-dynamic'

function formatWhen(value: Date | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
  }).format(value)
}

function intentClass(level: string) {
  if (level === 'hot') return 'bg-rose-500/15 text-rose-300 border-rose-400/20'
  if (level === 'qualified') return 'bg-amber-500/15 text-amber-200 border-amber-400/20'
  if (level === 'engaged') return 'bg-sky-500/15 text-sky-200 border-sky-400/20'
  return 'bg-white/5 text-slate-300 border-white/10'
}

export default async function VisitorIntentPage() {
  const visitors = await getHotVisitors(30)
  const hotCount = visitors.filter((visitor) => visitor.intentLevel === 'hot').length
  const knownCount = visitors.filter((visitor) => visitor.contactId).length

  return (
    <div className="space-y-8 p-6 md:p-8">
      <PageHeader
        eyebrow="Lead Intelligence"
        title="Hot Website Visitors"
        description="See which sessions are showing buying intent, what they clicked, and whether the visitor has become an identifiable CRM contact."
        actions={
          <Link
            href="/admin/crm/hub"
            className="inline-flex items-center gap-2 rounded-xl border border-[#C9A25F]/25 bg-[#C9A25F]/10 px-4 py-2 text-sm font-medium text-[#F4E6C5] transition hover:bg-[#C9A25F]/15"
          >
            <i className="fa-solid fa-users-gear" /> CRM Hub
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Engaged+</p>
          <p className="mt-2 text-3xl font-black text-white">{visitors.length}</p>
        </div>
        <div className="rounded-2xl border border-rose-400/15 bg-rose-500/10 p-5">
          <p className="text-xs font-black uppercase tracking-widest text-rose-300">Hot</p>
          <p className="mt-2 text-3xl font-black text-white">{hotCount}</p>
        </div>
        <div className="rounded-2xl border border-emerald-400/15 bg-emerald-500/10 p-5">
          <p className="text-xs font-black uppercase tracking-widest text-emerald-300">Known Contacts</p>
          <p className="mt-2 text-3xl font-black text-white">{knownCount}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
        <div className="border-b border-white/10 px-6 py-4">
          <h2 className="text-lg font-black text-white">Visitor Intent Queue</h2>
          <p className="mt-1 text-xs text-slate-400">
            Scores are based on page views, service/product clicks, checkup activity, booking clicks, calls/texts/emails, form submissions, and appointments.
          </p>
        </div>

        {visitors.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-semibold text-white">No engaged visitors scored yet.</p>
            <p className="mt-2 text-sm text-slate-400">New site activity will appear here automatically.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-400">Visitor / Contact</th>
                  <th className="px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-400">Score</th>
                  <th className="px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-400">Last Action</th>
                  <th className="px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-400">Interest</th>
                  <th className="px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-400">Source</th>
                  <th className="px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-400">Last Seen</th>
                  <th className="px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-400">Follow-up</th>
                </tr>
              </thead>
              <tbody>
                {visitors.map((visitor) => {
                  const name = [visitor.firstName, visitor.lastName].filter(Boolean).join(' ')
                  return (
                    <tr key={visitor.visitorId} className="border-b border-white/5 align-top hover:bg-white/[0.03]">
                      <td className="px-5 py-4">
                        {visitor.contactId ? (
                          <div>
                            <Link href={`/admin/contacts/${visitor.contactId}`} className="font-bold text-white hover:text-[#C9A25F]">
                              {name || visitor.email || visitor.phone || 'Known contact'}
                            </Link>
                            <p className="mt-1 text-xs text-emerald-300">Identified CRM contact</p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-semibold text-white">Anonymous visitor</p>
                            <p className="mt-1 max-w-[220px] truncate font-mono text-[11px] text-slate-500" title={visitor.visitorId}>
                              {visitor.visitorId}
                            </p>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-black text-white">{visitor.score}</span>
                          <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-wider ${intentClass(visitor.intentLevel)}`}>
                            {visitor.intentLevel}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-white">{visitor.lastEventType?.replaceAll('_', ' ') || '—'}</p>
                        <p className="mt-1 max-w-[250px] truncate text-xs text-slate-400" title={visitor.lastPageUrl ?? undefined}>
                          {visitor.lastPageUrl || visitor.landingPage || '—'}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-slate-300">
                        {visitor.productInterest?.replaceAll('_', ' ') || 'General / not identified'}
                        {visitor.county ? <p className="mt-1 text-xs text-slate-500">{visitor.county} County</p> : null}
                      </td>
                      <td className="px-5 py-4 text-slate-300">
                        <p>{visitor.source || 'Direct / unknown'}</p>
                        {visitor.campaign ? <p className="mt-1 text-xs text-slate-500">{visitor.campaign}</p> : null}
                      </td>
                      <td className="px-5 py-4 text-slate-300">{formatWhen(visitor.lastEventAt || visitor.lastSeenAt)}</td>
                      <td className="px-5 py-4">
                        {visitor.contactId ? (
                          <div className="space-y-2">
                            <Link
                              href={`/admin/contacts/${visitor.contactId}`}
                              className="inline-flex rounded-lg bg-[#C9A25F] px-3 py-2 text-xs font-black text-black hover:brightness-105"
                            >
                              Open Contact
                            </Link>
                            {visitor.intentLevel === 'hot' ? (
                              <p className="text-xs text-rose-300">15-minute follow-up task is created when the visitor first crosses hot.</p>
                            ) : null}
                          </div>
                        ) : (
                          <p className="max-w-[210px] text-xs leading-5 text-slate-400">
                            Keep nurturing onsite. Direct phone/email follow-up becomes available only after the visitor voluntarily identifies themselves.
                          </p>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
