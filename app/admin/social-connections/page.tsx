export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import PageHeader from '@/app/admin/_components/PageHeader'
import SocialConnectionsClient from './SocialConnectionsClient'

export default async function SocialConnectionsPage() {
  const socialConnectionModel = (prisma as any).socialConnection
  const connections: any[] = socialConnectionModel
    ? await socialConnectionModel.findMany({ orderBy: { updatedAt: 'desc' } })
    : []

  const serialized = connections.map((c: any) => ({
    ...c,
    tokenExpiresAt: c.tokenExpiresAt ? c.tokenExpiresAt.toISOString() : null,
    updatedAt: c.updatedAt instanceof Date ? c.updatedAt.toISOString() : c.updatedAt,
  }))

  return (
    <div className="p-6 md:p-8">
      <PageHeader
        eyebrow="Settings"
        title="Social Connections"
        description="Manage access tokens and credentials for social media publishing."
      />

      <SocialConnectionsClient initialConnections={serialized} />
    </div>
  )
}
