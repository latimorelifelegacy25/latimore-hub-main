import type { Contact, Inquiry } from '@prisma/client'

export type LeadScoreInput = Pick<Contact, 'email' | 'phone' | 'county'> &
  Pick<Inquiry, 'source' | 'medium' | 'campaign' | 'productInterest' | 'stage' | 'status'> & {
    interactionCount?: number
  }

function hasValue(value: unknown): boolean {
  return typeof value === 'string' ? value.trim().length > 0 : value != null
}

function contains(value: unknown, needle: string): boolean {
  return String(value ?? '').toLowerCase().includes(needle.toLowerCase())
}

export function calculateLeadScore(input: LeadScoreInput): number {
  let score = 0

  if (hasValue(input.email)) score += 10
  if (hasValue(input.phone)) score += 15
  if (hasValue(input.county)) score += 5
  if (hasValue(input.campaign)) score += 10
  if (contains(input.medium, 'qr')) score += 10
  if (contains(input.medium, 'referral')) score += 10
  if (contains(input.source, 'pahs')) score += 15
  if (contains(input.campaign, 'allsponsor')) score += 10
  if (input.productInterest && input.productInterest !== 'General') score += 10

  const stageBoost: Record<string, number> = {
    New: 0,
    Attempted_Contact: 5,
    Qualified: 20,
    Booked: 30,
    Sold: 40,
    Follow_Up: 10,
    Lost: -20,
  }
  score += stageBoost[String(input.stage)] ?? 0
  score += Math.min(input.interactionCount ?? 0, 10)

  if (String(input.status) === 'QUALIFIED') score += 10

  return Math.max(0, Math.min(100, score))
}

export async function updateLeadScores(params: {
  contact: Pick<Contact, 'id' | 'email' | 'phone' | 'county'>
  inquiry: Pick<Inquiry, 'id' | 'source' | 'medium' | 'campaign' | 'productInterest' | 'stage' | 'status'>
  eventCount?: number
  prisma: {
    contact: { update(args: { where: { id: string }; data: { leadScore: number } }): Promise<unknown> }
    inquiry: { update(args: { where: { id: string }; data: { leadScore: number } }): Promise<unknown> }
  }
}) {
  const score = calculateLeadScore({
    email: params.contact.email,
    phone: params.contact.phone,
    county: params.contact.county,
    source: params.inquiry.source,
    medium: params.inquiry.medium,
    campaign: params.inquiry.campaign,
    productInterest: params.inquiry.productInterest,
    stage: params.inquiry.stage,
    status: params.inquiry.status,
    interactionCount: params.eventCount,
  })

  await Promise.all([
    params.prisma.contact.update({ where: { id: params.contact.id }, data: { leadScore: score } }),
    params.prisma.inquiry.update({ where: { id: params.inquiry.id }, data: { leadScore: score } }),
  ])

  return score
}
