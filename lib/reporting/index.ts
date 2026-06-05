// lib/reporting/insights.ts
import type { 
  PipelineItem, 
  LeadScoreRange, 
  TaskMetrics, 
  FunnelStage, 
  RecentActivityItem, 
  AiTaskStats 
} from './types'

export function generateInsights({
  pipeline,
  leadScores,
  tasks,
  funnel,
  recentActivity,
  aiTasks
}: {
  pipeline: PipelineItem[]
  leadScores: LeadScoreRange[]
  tasks: TaskMetrics
  funnel: FunnelStage[]
  recentActivity: RecentActivityItem[]
  aiTasks: AiTaskStats
}) {
  const insights: string[] = []

  // Pipeline bottleneck
  const stalled = pipeline.find(p => p.status === 'ATTEMPTED_CONTACT')
  if (stalled && stalled.count > 0) {
    insights.push(
      `A significant number of leads (${stalled.count}) are stalling at the Contact Attempted stage. Consider increasing follow‑up attempts or adjusting outreach timing.`
    )
  }

  // Lead score distribution
  const highScore = leadScores.find(r => r.range === '80-100')
  if (highScore && highScore.count > 0) {
    insights.push(
      `You have ${highScore.count} high‑quality leads (80+ score) generated in the last 30 days. Prioritize outreach to maximize conversions.`
    )
  }

  // Funnel drop‑off
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
      `The largest funnel drop‑off is at the "${biggestDrop.stage}" stage. Review messaging or qualification criteria for this step.`
    )
  }

  // AI task performance
  if (aiTasks.generated > 0) {
    insights.push(
      `AI‑generated tasks show a ${aiTasks.completionRate}% completion rate. Consider assigning more follow‑ups or reminders to improve execution.`
    )
  }

  // Activity trend
  if (recentActivity.length < 5) {
    insights.push(
      `Engagement appears low over the last 7 days. Consider re‑engaging dormant leads or sending a broadcast message.`
    )
  }

  return insights
}
9
