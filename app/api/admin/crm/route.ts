import { LeadStatus } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdminSession } from '@/lib/ai/shared'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50

const CreateContactSchema = z.object({
  name: z.string().trim().max(200).optional().nullable(),
  email: z.string().trim().email().max(200).optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  status: z.string().trim().max(50).optional().nullable(),
})

export async function GET(req: NextRequest) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  try {
    const page = Math.max(1, Number(req.nextUrl.searchParams.get('page') ?? '1') || 1)

    const contacts = await prisma.contact.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    })

    return NextResponse.json({ contacts, page, hasMore: contacts.length === PAGE_SIZE })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ ok: false, error: 'Failed to load contacts.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  try {
    const body = await req.json()
    const parsed = CreateContactSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 })
    }
    const { name, email, phone, status } = parsed.data

    const created = await prisma.contact.create({
      data: {
        fullName: name?.trim() || null,
        email: email ?? null,
        phone: phone ?? null,
        status: normalizeLeadStatus(status),
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ ok: false, error: 'Failed to create contact.' }, { status: 500 })
  }
}

function normalizeLeadStatus(status: unknown): LeadStatus {
  if (typeof status !== 'string') return LeadStatus.NEW
  const normalized = status.trim().toUpperCase()
  return normalized in LeadStatus ? LeadStatus[normalized as keyof typeof LeadStatus] : LeadStatus.NEW
}
