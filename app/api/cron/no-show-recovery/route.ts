export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCronAuth } from '@/lib/ai/shared'
import { sendGoogleChatMessage } from '@/lib/google-chat'
import { sendMail } from '@/lib/mailer'
import { NoShowRecovery } from '@/emails/templates'
import { logger } from '@/lib/logger'

const GRACE_PERIOD_MS = 30 * 60 * 1000
const LOOKBACK_MS = 24 * 60 * 60 * 1000

export async function GET(req: NextRequest) {
  const authError = requireCronAuth(req)
  if (authError) return authError

  const cutoff = new Date(Date.now() - GRACE_PERIOD_MS)
  const lookback = new Date(Date.now() - LOOKBACK_MS)
  const thankYouFrom = process.env.THANKYOU_FROM

  const events = await prisma.calendarEvent.findMany({
    where: {
      startAt: { gt: lookback, lt: cutoff },
      status: { in: ['scheduled', 'confirmed'] },
    },
    include: { contact: true },
  })

  let recovered = 0

  for (const event of events) {
    const contact = event.contact
    const contactName = [contact?.firstName, contact?.lastName].filter(Boolean).join(' ') || contact?.email || contact?.phone || 'Unknown contact'
    let recoveryEmailSent = false

    await prisma.calendarEvent.update({ where: { id: event.id }, data: { status: 'no_show' } })

    if (contact?.email && thankYouFrom) {
      try {
        await sendMail({
          to: contact.email,
          from: thankYouFrom,
          subject: "We missed you — let's reschedule",
          html: NoShowRecovery({ firstName: contact.firstName ?? undefined }),
        })
        recoveryEmailSent = true
      } catch (error) {
        logger.error({ err: error instanceof Error ? error.message : String(error) }, '[no-show-recovery] recovery email failed')
      }
    }

    const followUpInstruction = recoveryEmailSent
      ? 'Recovery email sent automatically; follow up by phone.'
      : 'Recovery email was not sent automatically; follow up by phone and email manually.'

    if (contact) {
      await prisma.task.create({
        data: {
          title: `No-show follow-up: ${contactName}`,
          description: `Missed appointment on ${event.startAt.toLocaleString('en-US')}. ${followUpInstruction}`,
          dueAt: new Date(),
          contactId: contact.id,
          inquiryId: event.inquiryId ?? undefined,
        },
      })
    }

    await prisma.systemEvent.create({
      data: {
        type: 'appointment.no_show.detected',
        contactId: contact?.id,
        inquiryId: event.inquiryId,
        payload: { eventId: event.id, scheduledFor: event.startAt.toISOString(), recoveryEmailSent },
      },
    })

    await sendGoogleChatMessage(
      `No-show detected\n\nContact: ${contactName}\nScheduled: ${event.startAt.toLocaleString('en-US')}\n${followUpInstruction}`,
    )

    recovered += 1
  }

  return NextResponse.json({ ok: true, recovered })
}
