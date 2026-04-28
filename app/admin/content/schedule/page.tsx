import PageHeader from '../../_components/PageHeader'

export default function SchedulePage() {
  return (
    <div className="p-6 md:p-8">
      <PageHeader
        eyebrow="Content Planning"
        title="Schedule"
        description="View your scheduled content across all platforms"
      />

      <div className="mt-8 bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
        <i className="fa-solid fa-calendar-check text-5xl text-slate-500 mb-4"></i>
        <p className="text-slate-400 text-lg mb-2">Content Schedule</p>
        <p className="text-slate-500 text-sm">Coming soon - View all your scheduled posts</p>
      </div>
    </div>
  )
}
