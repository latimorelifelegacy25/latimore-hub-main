// lib/reporting/index.ts
import { getPipelineDistribution } from './pipeline'
import { getLeadScoreDistribution } from './scores'
import { getTaskMetrics } from './tasks'
import { getConversionFunnel } from './funnel'
import { getRecentActivity } from './activity'
import { getAiTaskStats } from './aiTasks'
import { getRecentEventFeed } from './events'

export async function getCrmAnalytics() {
  const [
    pipeline,
    leadScores,
    tasks,
    funnel,
    recentActivity,
    aiTasks
  ] = await Promise.all([
    getPipelineDistribution(),
    getLeadScoreDistribution(),
    getTaskMetrics(),
    getConversionFunnel(),
    getRecentActivity(10),
    getAiTaskStats()
  ])

  return {
    pipeline,
    leadScores,
    tasks,
    funnel,
    recentActivity,
    aiTasks
  }
}

export async function getCrmEvents(limit = 100) {
  return getRecentEventFeed(limit)
}
