import { EngagementNav, ExecutivePageHeader, ExecutiveShell, KpiCard, NarrativeInsightCard } from '@/components/admin/engagement/ExecutiveComponents'
import { getExecutiveDashboard, rangeFromDays } from '@/lib/engagement/executive'

function fmt(n: number) {
  return Math.round(n).toLocaleString()
}

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`
}

export default async function ExecutiveDashboardPage() {
  const data = await getExecutiveDashboard(rangeFromDays(30))
  const topInsight = data.topInsights[0]

  return (
    <ExecutiveShell>
      <ExecutivePageHeader title="Engagement Overview" subtitle="Executive view of cross-platform activity, lead signals, and next-best actions." />
      <EngagementNav />

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="Engagement" value={fmt(data.totals.engagement)} note={`${data.deltas.engagement.percent.toFixed(1)}% vs previous period`} />
        <KpiCard label="Clicks" value={fmt(data.totals.clicks)} note="Traffic intent signals" />
        <KpiCard label="Leads" value={fmt(data.totals.leads)} note="Social-attributed lead signals" />
        <KpiCard label="Engagement Rate" value={pct(data.totals.engagementRate)} note="Engagement / reach or impressions" />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium text-slate-950">30-Day Trend</h2>
            <p className="mt-1 text-sm text-slate-500">Engagement, clicks, and leads by day.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-3">
          {data.trend.slice(-14).map((row) => (
            <div key={row.date} className="grid grid-cols-[110px_1fr_80px] items-center gap-3 text-sm">
              <span className="text-slate-500">{row.date}</span>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-[#C49A6C]" style={{ width: `${Math.min(100, row.engagement)}%` }} />
              </div>
              <span className="text-right font-medium text-slate-900">{row.engagement}</span>
            </div>
          ))}
          {data.trend.length === 0 ? <p className="text-sm text-slate-500">No trend data yet. Run social sync or ingest metrics.</p> : null}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-lg font-medium text-slate-950">Sentiment Summary</h2>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <KpiCard label="Positive" value={data.sentiment.positive} />
            <KpiCard label="Neutral" value={data.sentiment.neutral} />
            <KpiCard label="Negative" value={data.sentiment.negative} />
          </div>
        </section>

        <section className="space-y-4">
          {topInsight ? (
            <NarrativeInsightCard title={topInsight.title} summary={topInsight.summary} action={topInsight.action} severity={topInsight.severity} />
          ) : (
            <NarrativeInsightCard title="No major risk detected" summary="The dashboard has not detected a major engagement spike, complaint pattern, or high-intent lead signal yet." action="Keep publishing education-first content with trackable CTAs." />
          )}
          {data.nextActions.slice(0, 2).map((action) => (
            <NarrativeInsightCard key={action.title} title={action.title} summary={action.reason} severity={action.priority} />
          ))}
        </section>
      </div>
    </ExecutiveShell>
  )
}
