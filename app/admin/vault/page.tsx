import PageHeader from '../_components/PageHeader'

export default function AssetVaultPage() {
  return (
    <div className="p-6 md:p-8">
      <PageHeader
        eyebrow="Media Library"
        title="Asset Vault"
        description="Store and organize marketing assets, images, and documents"
      />

      <div className="mt-8 bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
        <i className="fa-solid fa-vault text-5xl text-slate-500 mb-4"></i>
        <p className="text-slate-400 text-lg mb-2">Asset Management</p>
        <p className="text-slate-500 text-sm">Coming soon - Upload and organize your marketing assets</p>
      </div>
    </div>
  )
}
