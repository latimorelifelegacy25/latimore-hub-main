'use client'

import { useEffect, useMemo, useState } from 'react'
import FilterBar from './components/FilterBar'
import KpiSection from './components/KpiSection'
import TrendChart from './components/TrendChart'
import FunnelSection from './components/FunnelSection'
import BreakdownSection from './components/BreakdownSection'
import RecentEventsSection from './components/RecentEventsSection'
import OpportunitiesTable from './components/OpportunitiesTable'
import { useApi } from './hooks/useApi'
import { analyticsApi } from './lib/analyticsApi'
import { Range } from './lib/types'

export default function AnalyticsPage() {
  const [range, setRange] = useState<Range>('30d')

  const qs = useMemo(() => new URLSearchParams({ range }).toString(), [range])

  const overviewFetcher = () => analyticsApi.overview(qs)
  const funnelFetcher = () => analyticsApi.funnel(qs)
  const timeSeriesFetcher = () => analyticsApi.timeSeries(qs)
  const breakdownsFetcher = () => analyticsApi.breakdowns(qs)
  const recentEventsFetcher = () => analyticsApi.recentEvents()
  const opportunitiesFetcher = () => analyticsApi.opportunities()

  const overview = useApi(overviewFetcher)
  const funnel = useApi(funnelFetcher)
  const timeSeries = useApi(timeSeriesFetcher)
  const breakdowns = useApi(breakdownsFetcher)
  const recentEvents = useApi(recentEventsFetcher)
  const opportunities = useApi(opportunitiesFetcher)

  const loading =
    overview.loading ||
    funnel.loading ||
    timeSeries.loading ||
    breakdowns.loading ||
    recentEvents.loading ||
    opportunities.loading

  const runOverview = overview.run
  const runFunnel = funnel.run
  const runTimeSeries = timeSeries.run
  const runBreakdowns = breakdowns.run
  const runRecentEvents = recentEvents.run
  const runOpportunities = opportunities.run

  const refresh = useCallback(() => {
    runOverview()
    runFunnel()
    runTimeSeries()
    runBreakdowns()
    runRecentEvents()
    runOpportunities()
  }, [runOverview, runFunnel, runTimeSeries, runBreakdowns, runRecentEvents, runOpportunities])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { refresh() }, [qs])

  return (
    <main className="min-h-screen bg-[#0B0F17] px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-2">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#C9A25F]">Latimore OS</p>
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Analytics Command Center</h1>
          <p className="max-w-3xl text-sm text-[#A9B1BE] md:text-base">
            Monitor leads, funnel movement, source performance, recent activity, and priority follow-ups from one operational view.
          </p>
        </div>

        <FilterBar range={range} onRange={setRange} onRefresh={refresh} loading={dashboard.loading} />

        <KpiSection overview={dashboard.data?.overview ?? null} loading={dashboard.loading} error={dashboard.error} />

        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <TrendChart data={dashboard.data?.timeSeries ?? null} loading={dashboard.loading} error={dashboard.error} />
          <FunnelSection funnel={dashboard.data?.funnel ?? null} loading={dashboard.loading} error={dashboard.error} />
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <BreakdownSection rows={dashboard.data?.breakdowns ?? null} loading={dashboard.loading} error={dashboard.error} />
          <RecentEventsSection events={dashboard.data?.recentEvents ?? null} loading={dashboard.loading} error={dashboard.error} />
        </div>

        <OpportunitiesTable
          opportunities={dashboard.data?.opportunities ?? null}
          loading={dashboard.loading}
          error={dashboard.error}
        />
      </div>
    </main>
  )
}
