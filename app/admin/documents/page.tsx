export const dynamic = 'force-dynamic'

import PageHeader from '@/app/admin/_components/PageHeader'
import DocumentBuilder from './DocumentBuilder'

export default function DocumentsPage() {
  return (
    <div className="p-6 md:p-8 space-y-8">
      <PageHeader
        eyebrow="Admin Tools"
        title="Document Builder"
        description="Create and export branded documents — proposals, briefs, reports, and more."
      />
      <DocumentBuilder />
    </div>
  )
}
