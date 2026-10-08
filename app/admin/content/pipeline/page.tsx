export const dynamic = 'force-dynamic'

import PageHeader from '@/app/admin/_components/PageHeader'
import PipelineClient from './PipelineClient'

export default function ContentPipelinePage() {
  return (
    <div className="p-6 md:p-8">
      <PageHeader
        eyebrow="Marketing OS"
        title="Content Pipeline"
        description="One brief per topic: Strategist, Writer, Editor, then Repurposer. Everything stays a draft until you approve it."
      />
      <PipelineClient />
    </div>
  )
}
