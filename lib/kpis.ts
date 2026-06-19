import { prisma } from '@/lib/prisma'
import { EventType, PipelineStage } from '@prisma/client'

const CTA_EVENT_TYPES: EventType[] = [
  EventType.cta_click,
  EventType.call_click,
  EventType.text_click,
  EventType.email_click,
  EventType.book_click,
]

export type DateWindow = { from?: Date; to?: Date }

function windowToWhere(window?: DateWindow) {
  if (!window || (!window.from && !window.to)) return undefined
  return { gte: window.from, lte: window.to }
}

/**
 * Single source of truth for lead/booking/conversion counts so dashboard and
 * report endpoints stop computing the same numbers independently and drifting
 * apart. Window is optional — omit it for all-time totals.
 */
export async function getLeadMetrics(window?: DateWindow) {
  const createdAt = windowToWhere(window)
  const [total, byStage] = await Promise.all([
    prisma.inquiry.count({ where: { createdAt } }),
    prisma.inquiry.groupBy({ by: ['stage'], where: { createdAt }, _count: { _all: true } }),
  ])

  return {
    total,
    byStage: byStage.reduce<Record<string, number>>((acc, row) => {
      acc[row.stage] = row._count._all
      return acc
    }, {}),
  }
}

export async function getBookingMetrics(window?: DateWindow) {
  const createdAt = windowToWhere(window)
  const [total, cancelled] = await Promise.all([
    prisma.appointment.count({ where: { createdAt } }),
    prisma.appointment.count({ where: { createdAt, status: 'Cancelled' } }),
  ])

  return { total, cancelled, active: total - cancelled }
}

export async function getConversionMetrics(window?: DateWindow) {
  const createdAt = windowToWhere(window)
  const occurredAt = windowToWhere(window)

  const [leadCount, bookedCount, soldCount, clickCount] = await Promise.all([
    prisma.inquiry.count({ where: { createdAt } }),
    prisma.inquiry.count({ where: { createdAt, stage: PipelineStage.Booked } }),
    prisma.inquiry.count({ where: { createdAt, stage: PipelineStage.Sold } }),
    prisma.event.count({ where: { occurredAt, eventType: { in: CTA_EVENT_TYPES } } }),
  ])

  return {
    totals: { leads: leadCount, clicks: clickCount, booked: bookedCount, sold: soldCount },
    rates: {
      clicksToLeads: clickCount > 0 ? Number((leadCount / clickCount).toFixed(3)) : 0,
      leadsToBooked: leadCount > 0 ? Number((bookedCount / leadCount).toFixed(3)) : 0,
      leadsToSold: leadCount > 0 ? Number((soldCount / leadCount).toFixed(3)) : 0,
    },
  }
}
