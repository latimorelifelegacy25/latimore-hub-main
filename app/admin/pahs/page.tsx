export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import PahsLeadsClient, { type PahsLead } from './PahsLeadsClient'

const PAHS_WHERE = {
  OR: [
    { source: { contains: 'PAHS', mode: 'insensitive' as const } },
    { landingPage: { contains: 'pahs', mode: 'insensitive' as const } },
  ],
}

function loadInquiries() {
  return prisma.inquiry.findMany({
    where: PAHS_WHERE,
    orderBy: { createdAt: 'desc' },
    take: 500,
    include: { contact: true },
  })
}

function DatabaseErrorNotice() {
  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-3xl rounded-3xl border border-red-400/25 bg-red-500/10 p-6 text-sm text-red-100">
        <p className="text-lg font-black text-white">PAHS leads can&apos;t load — database unreachable</p>
        <p className="mt-2 leading-6">
          The app could not connect to the database. This usually means the <code>DATABASE_URL</code> environment
          variable on Vercel is pointing at the direct Supabase host (port 5432) instead of the pooled connection
          (port 6543), or the database is paused. Fix the env var and redeploy, then reload this page.
        </p>
      </div>
    </div>
  )
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
  let inquiries: Awaited<ReturnType<typeof loadInquiries>>
  try {
    inquiries = await loadInquiries()
  } catch (error) {
    console.error('[admin/pahs] Failed to load PAHS leads:', error)
    return <DatabaseErrorNotice />
  }

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
