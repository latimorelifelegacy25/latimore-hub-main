import PageHeader from '../_components/PageHeader'

export default function PortalsAndLinksPage() {
  return (
    <div className="p-6 md:p-8">
      <PageHeader
        eyebrow="Resource Hub"
        title="Portals & Links"
        description="Manage carrier portals, client portals, and important links"
      />

      <div className="mt-8 bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
        <i className="fa-solid fa-link text-5xl text-slate-500 mb-4"></i>
        <p className="text-slate-400 text-lg mb-2">Link Vault</p>
        <p className="text-slate-500 text-sm">Coming soon - Organize and manage all your important links</p>
      </div>
    </div>
  )
}
