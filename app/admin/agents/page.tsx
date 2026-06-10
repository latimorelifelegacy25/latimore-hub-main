export const dynamic = 'force-dynamic'

import PageHeader from '@/app/admin/_components/PageHeader'
import AdminCard from '@/app/admin/_components/AdminCard'
import AgentWorkflowPanel from './AgentWorkflowPanel'

export default function AgentsPage() {
  return (
    <div className="p-6 md:p-8 space-y-4">
      <PageHeader
        eyebrow="AI Agents"
        title="Agent Workflows"
        description="Run a planner-researcher-executor-reviewer agent team on a goal, grounded in CRM data."
      />
      <AdminCard title="Run a Workflow" subtitle="Each run is logged as an AI run for auditing.">
        <AgentWorkflowPanel />
      </AdminCard>
    </div>
  )
}
