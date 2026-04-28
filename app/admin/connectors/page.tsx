import PageHeader from '../_components/PageHeader'

export default function IntegrationsPage() {
  return (
    <div className="p-6 md:p-8">
      <PageHeader
        eyebrow="System"
        title="Integrations"
        description="Connect and manage third-party integrations"
      />

      <div className="mt-8 bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
        <i className="fa-solid fa-plug text-5xl text-slate-500 mb-4"></i>
        <p className="text-slate-400 text-lg mb-2">Integration Center</p>
        <p className="text-slate-500 text-sm">Coming soon - Manage your integrations</p>
      </div>
    </div>
  )
}
