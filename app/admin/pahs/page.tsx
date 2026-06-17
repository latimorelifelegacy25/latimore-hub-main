export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import PahsLeadsClient, { type PahsLead } from './PahsLeadsClient'

const PAHS_WHERE = {
  OR: [
    { source: { contains: 'PAHS', mode: 'insensitive' as const } },
    { landingPage: { contains: 'pahs', mode: 'insensitive' as const } },
  ],
}

function extractNoteField(notes: string | null, label: string): string {
  if (!notes) return ''
  const match = notes
    .split('|')
    .map((part) => part.trim())
    .find((part) => part.toLowerCase().startsWith(label.toLowerCase()))
  if (!match) return ''
  return match.slice(match.indexOf(':') + 1).trim()
}

export default async function PahsLeadsPage() {
  const inquiries = await prisma.inquiry.findMany({
    where: PAHS_WHERE,
    orderBy: { createdAt: 'desc' },
    take: 500,
    include: { contact: true },
  })

  const leads: PahsLead[] = inquiries.map((inquiry) => {
    const contact = inquiry.contact
    const fullName =
      contact?.fullName ||
      [contact?.firstName, contact?.lastName].filter(Boolean).join(' ') ||
      'Unknown'

    const coverageInterest =
      extractNoteField(inquiry.notes, 'Coverage interest') ||
      String(inquiry.productInterest).replace(/_/g, ' ')

    return {
      id: inquiry.id,
      fullName,
      phone: contact?.phone ?? '',
      email: contact?.email ?? '',
      county: inquiry.county ?? contact?.county ?? '',
      coverageInterest,
      bestTime: extractNoteField(inquiry.notes, 'Best time to call'),
      source: inquiry.source ?? '',
      medium: inquiry.medium ?? '',
      campaign: inquiry.campaign ?? '',
      landingPage: inquiry.landingPage ?? '',
      stage: inquiry.stage,
      createdAt: inquiry.createdAt.toISOString(),
    }
  })

  return <PahsLeadsClient leads={leads} />
}
