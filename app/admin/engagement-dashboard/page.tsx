import { requireAdminSession } from '@/lib/ai/shared'
import ExecutiveDashboardPage from './ExecutiveDashboardPage'

export const dynamic = 'force-dynamic'

export default async function EngagementDashboardPage() {
  await requireAdminSession()
  return <ExecutiveDashboardPage />
}
