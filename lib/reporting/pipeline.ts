// lib/reporting/pipeline.ts
import { prisma } from '@/lib/prisma'
import { getThirtyDaysAgo } from './dates'

export async function getPipelineDistribution() {
  const thirtyDaysAgo = getThirtyDaysAgo()

  const pipelineData = await prisma.contact.groupBy({
    by: ['status'],
    _count: { id: true },
    where: { createdAt: { gte: thirtyDaysAgo } }
  })

  return pipelineData.map(item => ({
    status: item.status,
    count: item._count.id,
    label: item.status.replace(/_/g, ' ')
  }))
}
