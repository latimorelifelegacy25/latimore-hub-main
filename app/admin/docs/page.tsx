import PageHeader from '../_components/PageHeader'

export default function BrochuresAndDocsPage() {
  return (
    <div className="p-6 md:p-8">
      <PageHeader
        eyebrow="Asset Library"
        title="Brochures & Docs"
        description="Manage product brochures, compliance documents, and carrier materials"
      />

      <div className="mt-8 bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
        <i className="fa-solid fa-folder-open text-5xl text-slate-500 mb-4"></i>
        <p className="text-slate-400 text-lg mb-2">Document Library</p>
        <p className="text-slate-500 text-sm">Coming soon - Connect your document management system</p>
      </div>
    </div>
  )
}
