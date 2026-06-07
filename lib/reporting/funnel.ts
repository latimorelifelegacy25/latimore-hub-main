// lib/reporting/funnel.ts
import { prisma } from '@/lib/prisma'
import { getThirtyDaysAgo } from './dates'

type FunnelRow = {
  stage: string
  count: number
  conversion_rate: number
}

export async function getConversionFunnel() {
  const thirtyDaysAgo = getThirtyDaysAgo()

  const funnelData = await prisma.$queryRaw<Array<FunnelRow>>`
    WITH stage_counts AS (
      SELECT
        CASE
          WHEN status = 'NEW' THEN 'New Leads'
          WHEN status = 'ATTEMPTED_CONTACT' THEN 'Contact Attempted'
          WHEN status = 'CONTACTED' THEN 'Contacted'
          WHEN status = 'QUALIFIED' THEN 'Qualified'
          WHEN status = 'BOOKED' THEN 'Booked'
          WHEN status = 'IN_CONSULT' THEN 'In Consultation'
          WHEN status = 'CLOSED_WON' THEN 'Closed Won'
          WHEN status = 'CLOSED_LOST' THEN 'Closed Lost'
          ELSE status
        END as stage,
        COUNT(*) as count,
        ROW_NUMBER() OVER (ORDER BY
          CASE status
            WHEN 'NEW' THEN 1
            WHEN 'ATTEMPTED_CONTACT' THEN 2
            WHEN 'CONTACTED' THEN 3
            WHEN 'QUALIFIED' THEN 4
            WHEN 'BOOKED' THEN 5
            WHEN 'IN_CONSULT' THEN 6
            WHEN 'CLOSED_WON' THEN 7
            WHEN 'CLOSED_LOST' THEN 8
            ELSE 9
          END
        ) as stage_order
      FROM "Contact"
      WHERE "createdAt" >= ${thirtyDaysAgo}
      GROUP BY status
    )
    SELECT
      stage,
      count,
      ROUND(
        CASE
          WHEN LAG(count) OVER (ORDER BY stage_order) > 0
          THEN (count::decimal / LAG(count) OVER (ORDER BY stage_order)) * 100
          ELSE 100
        END,
        1
      ) as conversion_rate
    FROM stage_counts
    ORDER BY stage_order
  `

  return funnelData
}
