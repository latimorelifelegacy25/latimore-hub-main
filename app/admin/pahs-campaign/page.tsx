export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import PAHSCampaignClient from './PAHSCampaignClient'

const PAHS_WHERE = {
  OR: [
    { source: { contains: 'PAHS', mode: 'insensitive' as const } },
    { landingPage: { contains: 'pahs', mode: 'insensitive' as const } },
  ],
}

function loadCampaignData() {
  return Promise.all([
    prisma.inquiry.count({ where: PAHS_WHERE }),

    prisma.inquiry.groupBy({
      by: ['stage'],
      where: PAHS_WHERE,
      _count: { _all: true },
    }),

    prisma.event.count({
      where: {
        eventType: 'page_view',
        pageUrl: { contains: 'pahs', mode: 'insensitive' },
      },
    }),

    prisma.leadSession.count({
      where: { landingPage: { contains: 'pahs', mode: 'insensitive' } },
    }),

    prisma.appointment.count({
      where: {
        inquiry: { is: PAHS_WHERE },
      },
    }),

    prisma.inquiry.findMany({
      where: PAHS_WHERE,
      orderBy: { createdAt: 'desc' },
      take: 15,
      include: {
        contact: {
          select: { firstName: true, lastName: true, email: true, phone: true },
        },
      },
    }),
  ] as const)
}

function DatabaseErrorNotice() {
  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-3xl rounded-3xl border border-red-400/25 bg-red-500/10 p-6 text-sm text-red-100">
        <p className="text-lg font-black text-white">PAHS campaign stats can&apos;t load — database unreachable</p>
        <p className="mt-2 leading-6">
          The app could not connect to the database. This usually means the <code>DATABASE_URL</code> environment
          variable on Vercel is pointing at the direct Supabase host (port 5432) instead of the pooled connection
          (port 6543), or the database is paused. Fix the env var and redeploy, then reload this page.
        </p>
      </div>
    </div>
  )
}

export default async function PAHSCampaignPage() {
  let data: Awaited<ReturnType<typeof loadCampaignData>>
  try {
    data = await loadCampaignData()
  } catch (error) {
    console.error('[admin/pahs-campaign] Failed to load campaign stats:', error)
    return <DatabaseErrorNotice />
  }

  const [leadsTotal, leadsByStage, pageVisits, qrSessions, appointmentsTotal, recentLeads] = data

  const pipelineMap = Object.fromEntries(
    leadsByStage.map((r) => [r.stage, r._count._all])
  )

  return (
    <PAHSCampaignClient
      stats={{
        leadsTotal,
        pipelineMap,
        pageVisits,
        qrSessions,
        appointmentsTotal,
        recentLeads: recentLeads.map((i) => ({
          id: i.id,
          name:
            [i.contact?.firstName, i.contact?.lastName].filter(Boolean).join(' ') || 'Unknown',
          email: i.contact?.email ?? '',
          phone: i.contact?.phone ?? '',
          stage: i.stage,
          source: i.source ?? '',
          productInterest: String(i.productInterest).replace(/_/g, ' '),
          createdAt: i.createdAt.toISOString(),
        })),
      }}
    />
  )
}
