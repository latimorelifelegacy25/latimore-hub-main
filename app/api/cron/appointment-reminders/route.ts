export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCronAuth } from '@/lib/ai/shared'
import { sendGoogleChatMessage } from '@/lib/google-chat'

export async function GET(req: NextRequest) {
  const authError = requireCronAuth(req)
  if (authError) return authError

  const now = new Date()
  const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000)

  const events = await prisma.calendarEvent.findMany({
    where: { startAt: { lte: inTwoHours, gte: now }, status: 'scheduled' },
    include: { contact: true },
  })

  const remindedEventIds = new Set<string>()
  if (events.length > 0) {
    const alreadyReminded = await prisma.systemEvent.findMany({
      where: {
        type: 'appointment.reminder.sent',
        OR: events.map((event) => ({ payload: { path: ['eventId'], equals: event.id } })),
      },
      select: { payload: true },
    })
    for (const systemEvent of alreadyReminded) {
      const eventId = (systemEvent.payload as { eventId?: string } | null)?.eventId
      if (eventId) remindedEventIds.add(eventId)
    }
  }

  let reminders = 0
  for (const event of events) {
    if (remindedEventIds.has(event.id)) continue

    const contactName = [event.contact?.firstName, event.contact?.lastName].filter(Boolean).join(' ') || event.contact?.email || event.contact?.phone || 'Unknown contact'
    await sendGoogleChatMessage(
      `Appointment reminder\n\nContact: ${contactName}\nScheduled: ${event.startAt.toLocaleString('en-US')}\nEvent ID: ${event.id}`,
    )
    reminders += 1
    await prisma.systemEvent.create({
      data: {
        type: 'appointment.reminder.sent',
        contactId: event.contact?.id,
        payload: { eventId: event.id, channel: 'google_chat' },
      },
    })
  }

  return NextResponse.json({ ok: true, reminders })
}
