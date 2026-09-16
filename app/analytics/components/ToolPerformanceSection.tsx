import { ToolPerformanceRow } from '../lib/types'
import SectionLoader from './SectionLoader'
import EmptyState from '@/app/_components/EmptyState'

function label(value: string) {
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export default function ToolPerformanceSection({
  rows,
  loading,
  error,
}: {
  rows: ToolPerformanceRow[] | null
  loading: boolean
  error: string | null
}) {
  if (loading) return <SectionLoader />
  if (error) return <EmptyState title="Tool tracking unavailable" description={error} />
  if (!rows || rows.length === 0) {
    return <EmptyState title="No tool activity yet" description="Tracked Latimore tools will appear here as they are used." />
  }

  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="border-b border-white/10 p-5">
        <h2 className="text-lg font-semibold text-white">Tool Performance</h2>
        <p className="mt-1 text-sm text-[#A9B1BE]">First-party activity by Latimore tool or workflow.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-white/[0.025] text-xs uppercase tracking-wider text-[#8F98A8]">
            <tr>
              <th className="px-5 py-3">Tool</th>
              <th className="px-3 py-3">Category</th>
              <th className="px-3 py-3 text-right">Events</th>
              <th className="px-3 py-3 text-right">Sessions</th>
              <th className="px-3 py-3 text-right">Starts</th>
              <th className="px-3 py-3 text-right">Completed</th>
              <th className="px-3 py-3 text-right">Leads</th>
              <th className="px-3 py-3 text-right">Bookings</th>
              <th className="px-5 py-3 text-right">Completion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((row) => (
              <tr key={row.tool} className="text-[#E5E7EB]">
                <td className="px-5 py-4 font-semibold text-white">{label(row.tool)}</td>
                <td className="px-3 py-4 text-[#A9B1BE]">{row.category ?? '—'}</td>
                <td className="px-3 py-4 text-right">{row.events.toLocaleString()}</td>
                <td className="px-3 py-4 text-right">{row.sessions.toLocaleString()}</td>
                <td className="px-3 py-4 text-right">{row.starts.toLocaleString()}</td>
                <td className="px-3 py-4 text-right">{row.completions.toLocaleString()}</td>
                <td className="px-3 py-4 text-right">{row.leadSubmissions.toLocaleString()}</td>
                <td className="px-3 py-4 text-right">{row.bookingClicks.toLocaleString()}</td>
                <td className="px-5 py-4 text-right font-bold text-[#C9A25F]">{row.starts > 0 ? `${row.completionRate.toFixed(1)}%` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
