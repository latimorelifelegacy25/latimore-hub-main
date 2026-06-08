import { LeadStatus } from '@prisma/client'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const contacts = await prisma.contact.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(contacts)
}

export async function POST(req: Request) {
  const data = await req.json()
  const name = typeof data.name === 'string' ? data.name.trim() : ''

  const created = await prisma.contact.create({
    data: {
      fullName: name || null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      status: normalizeLeadStatus(data.status),
    },
  })

  return NextResponse.json(created)
}

function normalizeLeadStatus(status: unknown): LeadStatus {
  if (typeof status !== 'string') return LeadStatus.NEW
  const normalized = status.trim().toUpperCase()
  return normalized in LeadStatus ? LeadStatus[normalized as keyof typeof LeadStatus] : LeadStatus.NEW
}
