// lib/reporting/aiTasks.ts
import { prisma } from '@/lib/prisma'
import { getThirtyDaysAgo } from './dates'

export async function getAiTaskStats() {
  const thirtyDaysAgo = getThirtyDaysAgo()

  const aiTaskStats = await prisma.task.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo },
      description: { contains: 'AI' }
    },
    select: {
      id: true,
      status: true,
      dueAt: true
    }
  })

  const completed = aiTaskStats.filter(t => t.status === 'Completed').length
  const pending = aiTaskStats.filter(t => t.status === 'Open').length
  const overdue = aiTaskStats.filter(
    t => t.status === 'Open' && t.dueAt && t.dueAt < new Date()
  ).length

  const completionRate =
    aiTaskStats.length > 0
      ? Math.round((completed / aiTaskStats.length) * 100)
      : 0

  return {
    generated: aiTaskStats.length,
    completed,
    pending,
    overdue,
    completionRate
  }
}
