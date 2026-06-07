// lib/reporting/activity.ts
import { prisma } from '@/lib/prisma'
import { getSevenDaysAgo } from './dates'

export async function getRecentActivity(limit = 10) {
  const sevenDaysAgo = getSevenDaysAgo()

  const recentActivity = await prisma.contact.findMany({
    where: {
      OR: [
        { lastActivityAt: { gte: sevenDaysAgo } },
        { updatedAt: { gte: sevenDaysAgo } }
      ]
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      status: true,
      leadScore: true,
      lastActivityAt: true,
      updatedAt: true
    },
    orderBy: { updatedAt: 'desc' },
    take: limit
  })

  return recentActivity.map(contact => ({
    id: contact.id,
    name: `${contact.firstName} ${contact.lastName}`,
    status: contact.status,
    leadScore: contact.leadScore,
    lastActivity: contact.lastActivityAt || contact.updatedAt
  }))
}
