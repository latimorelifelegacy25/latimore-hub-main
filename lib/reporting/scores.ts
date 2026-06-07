// lib/reporting/scores.ts
import { prisma } from '@/lib/prisma'
import { getThirtyDaysAgo } from './dates'

export async function getLeadScoreDistribution() {
  const thirtyDaysAgo = getThirtyDaysAgo()

  const scoreRanges = await prisma.$queryRaw<Array<{ range: string; count: number }>>`
    SELECT
      CASE
        WHEN "leadScore" >= 80 THEN '80-100'
        WHEN "leadScore" >= 60 THEN '60-79'
        WHEN "leadScore" >= 40 THEN '40-59'
        WHEN "leadScore" >= 20 THEN '20-39'
        ELSE '0-19'
      END as range,
      COUNT(*) as count
    FROM "Contact"
    WHERE "createdAt" >= ${thirtyDaysAgo}
    GROUP BY 1
    ORDER BY 1
  `

  return scoreRanges
}
