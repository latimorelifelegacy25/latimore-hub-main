// lib/reporting/tasks.ts
import { prisma } from '@/lib/prisma'
import { getThirtyDaysAgo } from './dates'

type TaskMetricsRow = {
  status: string
  count: number
  overdue: number
}

export async function getTaskMetrics() {
  const thirtyDaysAgo = getThirtyDaysAgo()

  const taskMetrics = await prisma.$queryRaw<Array<TaskMetricsRow>>`
    SELECT
      status,
      COUNT(*) as count,
      COUNT(CASE WHEN "dueAt" < NOW() AND status = 'Open' THEN 1 END) as overdue
    FROM "Task"
    WHERE "createdAt" >= ${thirtyDaysAgo}
    GROUP BY status
  `

  const total = taskMetrics.reduce((sum, item) => sum + Number(item.count), 0)
  const completed = taskMetrics.find(item => item.status === 'Completed')?.count || 0
  const open = taskMetrics.find(item => item.status === 'Open')?.count || 0
  const overdue = taskMetrics.reduce((sum, item) => sum + Number(item.overdue), 0)

  return { total, completed, open, overdue }
}
