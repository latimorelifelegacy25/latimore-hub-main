import { WorkflowBuilder } from '@/components/nexus/WorkflowBuilder'

export const metadata = {
  title: 'Workflow Sandbox | Latimore Hub OS',
  description: 'Sketch and simulate multi-step automation sequences locally. For live marketing automation, use /marketing.',
}

export default function WorkflowPage() {
  return (
    <div className="min-h-screen bg-[#0d1117]">
      <WorkflowBuilder />
    </div>
  )
}
