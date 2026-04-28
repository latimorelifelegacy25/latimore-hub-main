import PageHeader from '../_components/PageHeader'

export default function InboxPage() {
  return (
    <div className="p-6 md:p-8">
      <PageHeader
        eyebrow="Lead Management"
        title="Inbox (Intake)"
        description="Manage form submissions and intake forms"
      />

      <div className="mt-8 bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
        <i className="fa-solid fa-inbox text-5xl text-slate-500 mb-4"></i>
        <p className="text-slate-400 text-lg mb-2">Form Intake</p>
        <p className="text-slate-500 text-sm">Coming soon - Manage your form submissions</p>
      </div>
    </div>
  )
}
