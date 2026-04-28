'use client'

import { useState, useEffect } from 'react'
import { BarChart3, RefreshCw, TrendingUp, Users, Calendar, Target } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import PageHeader from '../_components/PageHeader'
import AdminCard from '../_components/AdminCard'
import EmptyState from '../_components/EmptyState'

type AnalyticsData = {
  sourceCounts: Array<{ source: string | null; _count: { _all: number } }>
  countyCounts: Array<{ county: string | null; _count: { _all: number } }>
  recentEvents: Array<{ id: string; type: string; source: string | null; medium: string | null; campaign: string | null; occurredAt: Date }>
  productCounts: Array<{ productInterest: string | null; _count: { _all: number } }>
}

type PredictiveInsights = {
  metrics: {
    totalInquiries: number
    totalContacts: number
    totalBookings: number
    conversionRate: number
    inquiryGrowth: number
  }
  insights: {
    trendAnalysis: string
    predictions: string[]
    opportunities: string[]
    risks: string[]
    recommendations: string[]
  }
  trendData: Array<{ date: string; inquiries: number; contacts: number; bookings: number }>
}

type TimeSeriesData = {
  dailyMetrics: Array<{
    date: string
    inquiries: number
    contacts: number
    bookings: number
    events: number
  }>
  funnelData: Array<{
    stage: string
    count: number
    conversion_rate: number
  }>
}

type CRMAnalyticsData = {
  pipeline: Array<{
    status: string
    count: number
    label: string
  }>
  leadScores: Array<{
    range: string
    count: number
  }>
  tasks: {
    total: number
    completed: number
    open: number
    overdue: number
  }
  funnel: Array<{
    stage: string
    count: number
    conversion_rate: number
  }>
  recentActivity: Array<{
    id: string
    name: string
    status: string
    leadScore: number | null
    lastActivity: Date
  }>
  aiTasks: {
    generated: number
    completed: number
    pending: number
    overdue: number
    completionRate: number
  }
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [insights, setInsights] = useState<PredictiveInsights | null>(null)
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData | null>(null)
  const [crmAnalytics, setCrmAnalytics] = useState<CRMAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [timeSeriesLoading, setTimeSeriesLoading] = useState(false)
  const [crmAnalyticsLoading, setCrmAnalyticsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/reports/overview-analytics')
      if (!response.ok) throw new Error('Failed to fetch analytics')
      const analyticsData = await response.json()
      setData(analyticsData)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchInsights = async () => {
    try {
      setInsightsLoading(true)
      const response = await fetch('/api/reports/predictive-insights')
      if (!response.ok) throw new Error('Failed to fetch insights')
      const insightsData = await response.json()
      setInsights(insightsData)
    } catch (error) {
      console.error('Failed to fetch insights:', error)
    } finally {
      setInsightsLoading(false)
    }
  }

  const fetchTimeSeries = async () => {
    try {
      setTimeSeriesLoading(true)
      const response = await fetch('/api/reports/time-series?days=30')
      if (!response.ok) throw new Error('Failed to fetch time series')
      const timeSeriesData = await response.json()
      setTimeSeries(timeSeriesData)
    } catch (error) {
      console.error('Failed to fetch time series:', error)
    } finally {
      setTimeSeriesLoading(false)
    }
  }

  const fetchCrmAnalytics = async () => {
    try {
      setCrmAnalyticsLoading(true)
      const response = await fetch('/api/reports/crm-analytics')
      if (!response.ok) throw new Error('Failed to fetch CRM analytics')
      const crmData = await response.json()
      setCrmAnalytics(crmData)
    } catch (error) {
      console.error('Failed to fetch CRM analytics:', error)
    } finally {
      setCrmAnalyticsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
    fetchInsights()
    fetchTimeSeries()
    fetchCrmAnalytics()
    // Set up real-time updates every 30 seconds
    const interval = setInterval(() => {
      fetchAnalytics()
      fetchInsights()
      fetchTimeSeries()
      fetchCrmAnalytics()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !data) {
    return (
      <div className="p-6 md:p-8">
        <PageHeader eyebrow="Analytics" title="Attribution & activity" description="Operational visibility into lead sources, county concentration, product demand, and recent system events." />
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-[#C9A25F]" />
          <span className="ml-3 text-slate-400">Loading analytics...</span>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6 md:p-8">
        <PageHeader eyebrow="Analytics" title="Attribution & activity" description="Operational visibility into lead sources, county concentration, product demand, and recent system events." />
        <EmptyState title="Failed to load analytics" description="Please try refreshing the page." />
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex justify-between items-start mb-6">
        <PageHeader eyebrow="Analytics" title="Attribution & activity" description="Operational visibility into lead sources, county concentration, product demand, and recent system events." />
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-slate-400">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#C9A25F] hover:bg-[#D4AF77] disabled:opacity-50 text-slate-900 font-semibold rounded-lg transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <AdminCard title="Top sources">
          {data.sourceCounts.length === 0 ? (
            <EmptyState title="No source attribution yet" />
          ) : (
            <div className="space-y-3">
              {data.sourceCounts.map((row) => (
                <div key={row.source ?? 'unknown'} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-medium text-white">{row.source ?? 'Unknown source'}</p>
                    <p className="text-sm font-semibold text-[#C9A25F]">{row._count._all}</p>
                  </div>
                  <div className="h-2 rounded-full bg-white/6">
                    <div
                      className="h-2 rounded-full bg-[#C9A25F] transition-all duration-500"
                      style={{ width: `${Math.min(100, row._count._all * 8)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminCard>

        <AdminCard title="Top counties">
          {data.countyCounts.length === 0 ? (
            <EmptyState title="No county data yet" />
          ) : (
            <div className="space-y-3">
              {data.countyCounts.map((row) => (
                <div key={row.county ?? 'unknown'} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-medium text-white">{row.county ?? 'Unknown county'}</p>
                    <p className="text-sm font-semibold text-[#C9A25F]">{row._count._all}</p>
                  </div>
                  <div className="h-2 rounded-full bg-white/6">
                    <div
                      className="h-2 rounded-full bg-[#C9A25F] transition-all duration-500"
                      style={{ width: `${Math.min(100, row._count._all * 8)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminCard>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr,1.1fr]">
        <AdminCard title="Product demand">
          {data.productCounts.length === 0 ? (
            <EmptyState title="No product demand data yet" />
          ) : (
            <div className="space-y-3">
              {data.productCounts.map((row) => (
                <div key={row.productInterest} className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3">
                  <p className="text-sm text-white">{row.productInterest}</p>
                  <p className="text-sm font-semibold text-[#C9A25F]">{row._count._all}</p>
                </div>
              ))}
            </div>
          )}
        </AdminCard>

        <AdminCard title="Recent system events">
          {data.recentEvents.length === 0 ? (
            <EmptyState title="No system events yet" description="Business activity will appear here after event ingestion is connected." icon={<BarChart3 size={18} />} />
          ) : (
            <div className="space-y-3">
              {data.recentEvents.map((event) => (
                <div key={event.id} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{event.type}</p>
                      <p className="mt-1 text-xs text-[#A9B1BE]">
                        {[event.source, event.medium, event.campaign].filter(Boolean).join(' · ') || 'No attribution'}
                      </p>
                    </div>
                    <p className="text-xs text-[#8F98A8]">
                      {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(event.occurredAt))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminCard>
      </div>

      {/* AI Predictive Insights */}
      <div className="mt-8">
        <AdminCard title="AI Predictive Insights">
          {insightsLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-[#C9A25F] mr-3" />
              <span className="text-slate-400">Generating insights...</span>
            </div>
          ) : insights ? (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#C9A25F]">{insights.metrics.totalInquiries}</p>
                  <p className="text-xs text-slate-400 uppercase tracking-widest">Inquiries (30d)</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#C9A25F]">{insights.metrics.totalContacts}</p>
                  <p className="text-xs text-slate-400 uppercase tracking-widest">Contacts (30d)</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#C9A25F]">{insights.metrics.totalBookings}</p>
                  <p className="text-xs text-slate-400 uppercase tracking-widest">Bookings (30d)</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#C9A25F]">{insights.metrics.conversionRate.toFixed(1)}%</p>
                  <p className="text-xs text-slate-400 uppercase tracking-widest">Conversion Rate</p>
                </div>
              </div>

              {/* Trend Analysis */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-2">Trend Analysis</h4>
                <p className="text-sm text-slate-300">{insights.insights.trendAnalysis}</p>
              </div>

              {/* Predictions */}
              {insights.insights.predictions.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">Predictions</h4>
                  <ul className="space-y-1">
                    {insights.insights.predictions.map((prediction, i) => (
                      <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                        <span className="text-[#C9A25F] mt-1">•</span>
                        {prediction}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Opportunities */}
              {insights.insights.opportunities.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">Opportunities</h4>
                  <ul className="space-y-1">
                    {insights.insights.opportunities.map((opportunity, i) => (
                      <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                        <span className="text-green-400 mt-1">•</span>
                        {opportunity}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Risks */}
              {insights.insights.risks.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">Risks to Monitor</h4>
                  <ul className="space-y-1">
                    {insights.insights.risks.map((risk, i) => (
                      <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                        <span className="text-red-400 mt-1">•</span>
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {insights.insights.recommendations.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">Recommendations</h4>
                  <ul className="space-y-1">
                    {insights.insights.recommendations.map((recommendation, i) => (
                      <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        {recommendation}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <EmptyState title="Unable to generate insights" description="AI analysis temporarily unavailable." />
          )}
        </AdminCard>
      </div>

      {/* Advanced Charts */}
      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        {/* Time Series Chart */}
        <AdminCard title="Lead Generation Trends (30 Days)">
          {timeSeriesLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-[#C9A25F]" />
            </div>
          ) : timeSeries?.dailyMetrics ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeries.dailyMetrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="date"
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                    labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  />
                  <Line
                    type="monotone"
                    dataKey="inquiries"
                    stroke="#C9A25F"
                    strokeWidth={2}
                    name="Inquiries"
                    dot={{ fill: '#C9A25F', strokeWidth: 2, r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="contacts"
                    stroke="#10B981"
                    strokeWidth={2}
                    name="Contacts"
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="bookings"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    name="Bookings"
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No time series data available" />
          )}
        </AdminCard>

        {/* Conversion Funnel Chart */}
        <AdminCard title="Conversion Funnel">
          {timeSeries?.funnelData ? (
            <div className="space-y-4">
              {timeSeries.funnelData.map((stage, index) => {
                const stageLabels = {
                  'New': 'New Leads',
                  'Attempted_Contact': 'Contact Attempted',
                  'Contacted': 'Contacted',
                  'Qualified': 'Qualified',
                  'Booked': 'Booked',
                  'In_Consult': 'In Consultation',
                  'Closed_Won': 'Closed Won',
                  'Closed_Lost': 'Closed Lost'
                }

                const maxCount = Math.max(...timeSeries.funnelData.map(d => d.count))
                const width = maxCount > 0 ? (stage.count / maxCount) * 100 : 0

                return (
                  <div key={stage.stage} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-white">
                        {stageLabels[stage.stage as keyof typeof stageLabels] || stage.stage}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[#C9A25F] font-semibold">{stage.count}</span>
                        {index > 0 && (
                          <span className="text-xs text-slate-400">
                            ({stage.conversion_rate.toFixed(1)}%)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-[#C9A25F] to-[#D4AF77] h-3 rounded-full transition-all duration-500"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState title="No funnel data available" />
          )}
        </AdminCard>
      </div>

      {/* CRM Analytics */}
      <div className="mt-8">
        <AdminCard title="CRM Performance Analytics">
          {crmAnalyticsLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-[#C9A25F] mr-3" />
              <span className="text-slate-400">Loading CRM analytics...</span>
            </div>
          ) : crmAnalytics ? (
            <div className="space-y-8">
              {/* Pipeline Overview */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-4">Pipeline Distribution</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {crmAnalytics.pipeline.map((stage) => (
                    <div key={stage.status} className="text-center">
                      <p className="text-2xl font-bold text-[#C9A25F]">{stage.count}</p>
                      <p className="text-xs text-slate-400 uppercase tracking-widest">{stage.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lead Score Distribution */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-4">Lead Score Distribution</h4>
                <div className="grid grid-cols-5 gap-2">
                  {crmAnalytics.leadScores.map((range) => (
                    <div key={range.range} className="text-center">
                      <div className="bg-slate-700 rounded-lg p-3">
                        <p className="text-lg font-bold text-[#C9A25F]">{range.count}</p>
                        <p className="text-xs text-slate-400">{range.range}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Task Metrics */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-4">Task Performance</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-400">{crmAnalytics.tasks.total}</p>
                    <p className="text-xs text-slate-400 uppercase tracking-widest">Total Tasks</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400">{crmAnalytics.tasks.completed}</p>
                    <p className="text-xs text-slate-400 uppercase tracking-widest">Completed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-400">{crmAnalytics.tasks.open}</p>
                    <p className="text-xs text-slate-400 uppercase tracking-widest">Open</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-400">{crmAnalytics.tasks.overdue}</p>
                    <p className="text-xs text-slate-400 uppercase tracking-widest">Overdue</p>
                  </div>
                </div>
              </div>

              {/* AI Task Performance */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-4">AI Task Generation</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-400">{crmAnalytics.aiTasks.generated}</p>
                    <p className="text-xs text-slate-400 uppercase tracking-widest">Generated</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400">{crmAnalytics.aiTasks.completed}</p>
                    <p className="text-xs text-slate-400 uppercase tracking-widest">Completed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-400">{crmAnalytics.aiTasks.pending}</p>
                    <p className="text-xs text-slate-400 uppercase tracking-widest">Pending</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-400">{crmAnalytics.aiTasks.overdue}</p>
                    <p className="text-xs text-slate-400 uppercase tracking-widest">Overdue</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[#C9A25F]">{crmAnalytics.aiTasks.completionRate}%</p>
                    <p className="text-xs text-slate-400 uppercase tracking-widest">Completion Rate</p>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-4">Recent Contact Activity (7 days)</h4>
                <div className="space-y-2">
                  {crmAnalytics.recentActivity.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                      <div>
                        <p className="text-sm font-medium text-white">{activity.name}</p>
                        <p className="text-xs text-slate-400">{activity.status.replace(/_/g, ' ')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[#C9A25F]">{activity.leadScore || 0}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(activity.lastActivity).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {crmAnalytics.recentActivity.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">No recent activity</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <EmptyState title="Unable to load CRM analytics" description="CRM data temporarily unavailable." />
          )}
        </AdminCard>
      </div>
    </div>
  )
}
