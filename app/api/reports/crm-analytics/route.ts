export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  const limited = await rateLimit(req, 'reports')
  if (limited) return limited

  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  try {
    const now = Date.now()
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)

    // Run all analytics queries in parallel
    const [
      pipelineData,
      scoreRanges,
      taskMetrics,
      funnelData,
      recentActivity,
      aiTaskStats
    ] = await Promise.all([
      prisma.contact.groupBy({
        by: ['status'],
        _count: { id: true },
        where: { createdAt: { gte: thirtyDaysAgo } }
      }),

      prisma.$queryRaw<Array<{ range: string; count: number }>>`
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
      `,

      prisma.$queryRaw<Array<{
        status: string
        count: number
        overdue: number
      }>>`
        SELECT
          status,
          COUNT(*) as count,
          COUNT(CASE WHEN due_at < NOW() AND status = 'Open' THEN 1 END) as overdue
        FROM "Task"
        WHERE created_at >= ${thirtyDaysAgo}
        GROUP BY status
      `,

      prisma.$queryRaw<Array<{
        stage: string
        count: number
        conversion_rate: number
      }>>`
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
          WHERE created_at >= ${thirtyDaysAgo}
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
      `,

      prisma.contact.findMany({
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
        take: 10
      }),

      prisma.task.findMany({
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
    ])

    const completedAiTasks = aiTaskStats.filter(t => t.status === 'Completed').length
    const pendingAiTasks = aiTaskStats.filter(t => t.status === 'Open').length
    const overdueAiTasks = aiTaskStats.filter(
      t => t.status === 'Open' && t.dueAt && t.dueAt < new Date()
    ).length

    return NextResponse.json({
      pipeline: pipelineData.map(item => ({
        status: item.status,
        count: item._count.id,
        label: item.status.replace(/_/g, ' ')
      })),
      leadScores: scoreRanges,
      tasks: {
        total: taskMetrics.reduce((sum, t) => sum + Number(t.count), 0),
        completed: taskMetrics.find(t => t.status === 'Completed')?.count || 0,
        open: taskMetrics.find(t => t.status === 'Open')?.count || 0,
        overdue: taskMetrics.reduce((sum, t) => sum + Number(t.overdue), 0)
      },
      funnel: funnelData,
      recentActivity: recentActivity.map(c => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        status: c.status,
        leadScore: c.leadScore,
        lastActivity: c.lastActivityAt || c.updatedAt
      })),
      aiTasks: {
        generated: aiTaskStats.length,
        completed: completedAiTasks,
        pending: pendingAiTasks,
        overdue: overdueAiTasks,
        completionRate:
          aiTaskStats.length > 0
            ? Math.round((completedAiTasks / aiTaskStats.length) * 100)
            : 0
      }
    })
  } catch (error) {
    console.error('CRM analytics API error:', error)
    return NextResponse.json({
      pipeline: [],
      leadScores: [],
      tasks: { total: 0, completed: 0, open: 0, overdue: 0 },
      funnel: [],
      recentActivity: [],
      aiTasks: { generated: 0, completed: 0, pending: 0, overdue: 0, completionRate: 0 }
    })
  }
      }
