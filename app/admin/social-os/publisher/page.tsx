import { prisma } from '@/lib/prisma'
import SocialPublisherClient from '../_components/SocialPublisherClient'

export const dynamic = 'force-dynamic'

export default async function SocialPublisherPage() {
  const connections = await (prisma as any).socialConnection.findMany({
    select: { id: true, provider: true, accountName: true, status: true },
    orderBy: { provider: 'asc' },
  })

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <SocialPublisherClient connections={connections} />
    </div>
  )
}
