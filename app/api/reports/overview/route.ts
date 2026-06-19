export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/require-admin'
import { getDashboardOverview } from '@/lib/hub/reporting'

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req, 'reports')
  if (authError) return authError

  const overview = await getDashboardOverview()

  return NextResponse.json({
    kpis: {
      leadsThisMonth: overview.kpis.leadsThisMonth,
      clicksThisMonth: overview.kpis.clicksThisMonth,
      bookingsThisMonth: overview.kpis.bookingsThisMonth,
      staleLeads: overview.kpis.staleLeads,
      duplicateLeads7Days: overview.kpis.duplicateLeads7Days,
      duplicateLeads30Days: overview.kpis.duplicateLeads30Days,
    },
    highlights: overview.highlights,
    pipeline: overview.pipeline.map((row) => ({ status: row.stage, count: row.count })),
    duplicateLeads: overview.duplicateLeads,
  })
}
