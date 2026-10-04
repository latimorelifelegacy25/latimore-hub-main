export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAgentRole } from '@/lib/rbac'
import { rateLimit } from '@/lib/rate-limit'
import { CalendarBookSchema } from '@/lib/schemas'

export async function POST(req: NextRequest) {
  const auth = await requireAgentRole()
  if (!auth.ok) return auth.response

  const limited = await rateLimit(req, 'adminSend', auth.email ?? undefined)
  if (limited) return limited

  const parsed = CalendarBookSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 422 })
  }
  const body = parsed.data

  const event = await prisma.calendarEvent.create({
    data: {
      contactId: body.contactId,
      inquiryId: body.inquiryId ?? undefined,
      provider: 'manual',
      title: body.title,
      startAt: new Date(body.startAt),
      endAt: body.endAt ? new Date(body.endAt) : undefined,
      meetingUrl: body.meetingUrl ?? undefined,
      timezone: body.timezone ?? undefined,
      location: body.location ?? undefined,
      status: 'scheduled',
    },
  })

  await prisma.systemEvent.create({
    data: { type: 'calendar.manual.booked', contactId: body.contactId, inquiryId: body.inquiryId ?? undefined, payload: { eventId: event.id } },
  })

  return NextResponse.json({ ok: true, event })
}
