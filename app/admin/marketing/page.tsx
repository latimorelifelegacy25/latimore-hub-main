import PageHeader from '../_components/PageHeader'

export default function MarketingToolsPage() {
  return (
    <div className="p-6 md:p-8">
      <PageHeader
        eyebrow="Marketing"
        title="Marketing Tools"
        description="Bulk scheduling, campaign tools, and automation"
      />

      <div className="mt-8 bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
        <i className="fa-solid fa-toolbox text-5xl text-slate-500 mb-4"></i>
        <p className="text-slate-400 text-lg mb-2">Marketing Toolbox</p>
        <p className="text-slate-500 text-sm">Coming soon - Advanced marketing tools and automation</p>
      </div>
    </div>
  )
}
