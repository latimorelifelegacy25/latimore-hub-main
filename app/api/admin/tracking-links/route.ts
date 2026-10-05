import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAdminSession } from '@/lib/ai/shared'
import { isAllowedDestination, SLUG_PATTERN } from '@/lib/tracking/links'

export const dynamic = 'force-dynamic'

// GA4 is case-sensitive; the UTM convention in this repo is lowercase.
const utmField = z
  .string()
  .trim()
  .max(100)
  .transform((value) => value.toLowerCase())
  .optional()

const createSchema = z.object({
  slug: z.string().regex(SLUG_PATTERN, 'slug must be 3-40 chars of a-z, 0-9, -'),
  destination: z
    .string()
    .trim()
    .max(2048)
    .refine(isAllowedDestination, 'destination is not an allowed target'),
  label: z.string().trim().max(120).optional(),
  utmSource: utmField,
  utmMedium: utmField,
  utmCampaign: utmField,
  utmContent: utmField,
  utmTerm: utmField,
  expiresAt: z.coerce.date().optional(),
})

const patchSchema = z.object({
  slug: z.string().regex(SLUG_PATTERN),
  active: z.boolean(),
})

function emptyToNull<T extends string | undefined>(value: T) {
  return value ? value : null
}

export async function GET() {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  const [links, counts] = await Promise.all([
    prisma.trackingLink.findMany({ orderBy: { createdAt: 'desc' }, take: 200 }),
    prisma.trackingClick.groupBy({ by: ['linkId'], _count: { _all: true } }),
  ])
  const byLink = new Map(counts.map((row) => [row.linkId, row._count._all]))

  return NextResponse.json({
    ok: true,
    links: links.map((link) => ({ ...link, clicks: byLink.get(link.id) ?? 0 })),
  })
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  const body = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'invalid_input', issues: parsed.error.flatten() }, { status: 400 })
  }
  const input = parsed.data

  try {
    const link = await prisma.trackingLink.create({
      data: {
        slug: input.slug,
        destination: input.destination,
        label: emptyToNull(input.label),
        utmSource: emptyToNull(input.utmSource),
        utmMedium: emptyToNull(input.utmMedium),
        utmCampaign: emptyToNull(input.utmCampaign),
        utmContent: emptyToNull(input.utmContent),
        utmTerm: emptyToNull(input.utmTerm),
        expiresAt: input.expiresAt ?? null,
        createdBy: auth.email,
      },
    })
    return NextResponse.json({ ok: true, link }, { status: 201 })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ ok: false, error: 'slug_taken' }, { status: 409 })
    }
    throw error
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  const parsed = patchSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'invalid_input' }, { status: 400 })
  }

  try {
    const link = await prisma.trackingLink.update({
      where: { slug: parsed.data.slug },
      data: { active: parsed.data.active },
    })
    return NextResponse.json({ ok: true, link })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
    }
    throw error
  }
}
