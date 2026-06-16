import { prisma } from '@/lib/prisma'
import { countAll } from '@/lib/prisma-helpers'

function readPayloadString(payload: unknown, key: string): string | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null
  const value = (payload as Record<string, unknown>)[key]
  return typeof value === 'string' && value.trim() ? value : null
}

export async function getDashboardOverview() {
  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const staleCutoff = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  const [
    leadsThisMonth,
    clicksThisMonth,
    bookingsThisMonth,
    duplicateLeads7Days,
    duplicateLeads30Days,
    countyGroups,
    sourceGroups,
    interestGroups,
    stageCounts,
    staleLeads,
    duplicateLeadRows,
  ] = await Promise.all([
    prisma.inquiry.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.event.count({
      where: {
        occurredAt: { gte: monthStart },
        eventType: { in: ['cta_click', 'call_click', 'text_click', 'email_click', 'book_click'] as any },
      },
    }),
    prisma.appointment.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.systemEvent.count({ where: { type: 'lead.deduped', occurredAt: { gte: sevenDaysAgo } } }),
    prisma.systemEvent.count({ where: { type: 'lead.deduped', occurredAt: { gte: thirtyDaysAgo } } }),
    prisma.inquiry.groupBy({
      by: ['county'],
      where: { county: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { county: 'desc' } },
      take: 5,
    }),
    prisma.inquiry.groupBy({
      by: ['source'],
      where: { source: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { source: 'desc' } },
      take: 5,
    }),
    prisma.inquiry.groupBy({
      by: ['productInterest'],
      _count: { _all: true },
      orderBy: { _count: { productInterest: 'desc' } },
      take: 5,
    }),
    prisma.inquiry.groupBy({
      by: ['stage'],
      _count: { _all: true },
    }),
    prisma.inquiry.count({
      where: {
        updatedAt: { lt: staleCutoff },
        stage: { in: ['New', 'Attempted_Contact', 'Qualified', 'Follow_Up'] as any },
      },
    }),
    prisma.systemEvent.findMany({
      where: { type: 'lead.deduped' },
      orderBy: { occurredAt: 'desc' },
      take: 10,
      include: {
        contact: { select: { firstName: true, lastName: true, email: true, phone: true } },
        inquiry: { select: { id: true, createdAt: true, source: true, campaign: true } },
      },
    }),
  ])

  const topPage = await prisma.$queryRaw<Array<{ page: string | null; count: bigint | number }>>`
    SELECT "pageUrl" AS page, COUNT(*) AS count
    FROM "Event"
    WHERE "pageUrl" IS NOT NULL
    GROUP BY 1
    ORDER BY COUNT(*) DESC
    LIMIT 1
  `

  return {
    kpis: {
      leadsThisMonth,
      clicksThisMonth,
      bookingsThisMonth,
      staleLeads,
      duplicateLeads7Days,
      duplicateLeads30Days,
    },
    highlights: {
      topCounty: countyGroups[0]
        ? { county: countyGroups[0].county, count: countAll(countyGroups[0]._count) }
        : null,
      topSource: sourceGroups[0]
        ? { source: sourceGroups[0].source, count: countAll(sourceGroups[0]._count) }
        : null,
      topInterest: interestGroups[0]
        ? { productInterest: interestGroups[0].productInterest, count: countAll(interestGroups[0]._count) }
        : null,
      topPage: topPage[0]
        ? { page: topPage[0].page, count: Number(topPage[0].count) }
        : null,
    },
    pipeline: stageCounts.map((row) => ({ stage: row.stage, count: countAll(row._count) })),
    duplicateLeads: duplicateLeadRows.map(row => ({
      id: row.id,
      contact: [row.contact?.firstName, row.contact?.lastName].filter(Boolean).join(' ') || row.contact?.email || row.contact?.phone || 'Unknown contact',
      source: row.source ?? row.inquiry?.source ?? null,
      campaign: row.campaign ?? row.inquiry?.campaign ?? null,
      originalInquiry: readPayloadString(row.payload, 'originalInquiryId'),
      duplicateDate: row.occurredAt.toISOString(),
    })),
  }
}

export async function getSourceReport() {
  return prisma.inquiry.groupBy({
    by: ['source', 'medium', 'campaign'],
    _count: { _all: true },
    orderBy: { source: 'asc' },
    take: 50,
  })
}

export async function getCountyReport() {
  return prisma.inquiry.groupBy({
    by: ['county'],
    where: { county: { not: null } },
    _count: { _all: true },
    orderBy: { _count: { county: 'desc' } },
    take: 50,
  })
}

export async function getRecentEvents(limit = 50) {
  return prisma.event.findMany({
    orderBy: { occurredAt: 'desc' },
    take: limit,
    include: {
      contact: { select: { firstName: true, lastName: true, email: true } },
      inquiry: { select: { productInterest: true, stage: true } },
    },
  })
}