// lib/reporting/scores.ts
import { prisma } from '@/lib/prisma'
import { getThirtyDaysAgo } from './dates'

export async function getLeadScoreDistribution() {
  const thirtyDaysAgo = getThirtyDaysAgo()

  const scoreRanges = await prisma.$queryRaw<Array<{ range: string; count: number }>>`
    SELECT
      CASE
        WHEN lead_score >= 80 THEN '80-100'
        WHEN lead_score >= 60 THEN '60-79'
        WHEN lead_score >= 40 THEN '40-59'
        WHEN lead_score >= 20 THEN '20-39'
        ELSE '0-19'
      END as range,
      COUNT(*) as count
    FROM "Contact"
    WHERE created_at >= ${thirtyDaysAgo}
    GROUP BY 1
    ORDER BY 1
  `

  return scoreRanges
}
