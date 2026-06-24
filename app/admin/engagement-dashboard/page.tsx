import { notFound } from 'next/navigation'
import { requireAdminSession } from '@/lib/ai/shared'
import ExecutiveDashboardPage from './ExecutiveDashboardPage'

export const dynamic = 'force-dynamic'

export default async function EngagementDashboardPage() {
  const auth = await requireAdminSession()
  if (!auth.ok) notFound()

  return <ExecutiveDashboardPage />
}
