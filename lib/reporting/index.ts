import { cached } from './cache'
import { getAiTaskStats } from './aiTasks'
import { getRecentActivity } from './activity'
import { getConversionFunnel } from './funnel'
import { getPipelineDistribution } from './pipeline'
import { getLeadScoreDistribution } from './scores'
import { getTaskMetrics } from './tasks'

export { getCrmEvents } from './events'

function generateInsights({
  pipeline,
  leadScores,
  funnel,
  recentActivity,
  aiTasks,
}: {
  pipeline: Array<{ status: string; count: number }>
  leadScores: Array<{ range: string; count: number }>
  funnel: Array<{ stage: string; count: number }>
  recentActivity: unknown[]
  aiTasks: { generated: number; completionRate: number }
}) {
  const insights: string[] = []

  const stalled = pipeline.find((p) => p.status === 'ATTEMPTED_CONTACT')
  if (stalled && stalled.count > 0) {
    insights.push(
      `A significant number of leads (${stalled.count}) are stalling at the Contact Attempted stage. Consider increasing follow-up attempts or adjusting outreach timing.`
    )
  }

  const highScore = leadScores.find((r) => r.range === '80-100')
  if (highScore && highScore.count > 0) {
    insights.push(
      `You have ${highScore.count} high-quality leads (80+ score) generated in the last 30 days. Prioritize outreach to maximize conversions.`
    )
  }

  const biggestDrop = funnel.reduce(
    (prev, curr, idx, arr) => {
      if (idx === 0) return prev
      const drop = arr[idx - 1].count - curr.count
      return drop > prev.drop ? { stage: curr.stage, drop } : prev
    },
    { stage: '', drop: 0 }
  )

  if (biggestDrop.drop > 0) {
    insights.push(
      `The largest funnel drop-off is at the "${biggestDrop.stage}" stage. Review messaging or qualification criteria for this step.`
    )
  }

  if (aiTasks.generated > 0) {
    insights.push(
      `AI-generated tasks show a ${aiTasks.completionRate}% completion rate. Consider assigning more follow-ups or reminders to improve execution.`
    )
  }

  if (recentActivity.length < 5) {
    insights.push(
      'Engagement appears low over the last 7 days. Consider re-engaging dormant leads or sending a broadcast message.'
    )
  }

  return insights
}

export async function getCrmAnalytics() {
  return cached('crm-analytics', 60_000, async () => {
    const [pipeline, leadScores, tasks, funnel, recentActivity, aiTasks] = await Promise.all([
      getPipelineDistribution(),
      getLeadScoreDistribution(),
      getTaskMetrics(),
      getConversionFunnel(),
      getRecentActivity(10),
      getAiTaskStats(),
    ])

    const insights = generateInsights({
      pipeline,
      leadScores,
      funnel,
      recentActivity,
      aiTasks,
    })

    return {
      pipeline,
      leadScores,
      tasks,
      funnel,
      recentActivity,
      aiTasks,
      insights,
    }
  })
}
