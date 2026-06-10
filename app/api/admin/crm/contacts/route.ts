import { NextResponse } from 'next/server'
import { LeadStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAdminSession } from '@/lib/ai/shared'

function optionalString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function normalizeStatus(value: unknown) {
  if (typeof value !== 'string') return LeadStatus.NEW
  const normalized = value.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_')
  return Object.values(LeadStatus).includes(normalized as LeadStatus)
    ? (normalized as LeadStatus)
    : LeadStatus.NEW
}

export async function GET() {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  const contacts = await prisma.contact.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return NextResponse.json(contacts)
}

export async function POST(req: Request) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  try {
    const data = await req.json()
    const fullName = optionalString(data?.fullName) ?? optionalString(data?.name)
    const email = optionalString(data?.email)
    const phone = optionalString(data?.phone)

    if (!fullName && !email && !phone) {
      return NextResponse.json({ error: 'Name, email, or phone is required' }, { status: 422 })
    }

    const created = await prisma.contact.create({
      data: {
        fullName,
        email,
        phone,
        status: normalizeStatus(data?.status),
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to save contact' }, { status: 500 })
  }
}
