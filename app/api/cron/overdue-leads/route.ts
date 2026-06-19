export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCronAuth } from '@/lib/ai/shared'
import { sendGoogleChatMessage } from '@/lib/google-chat'
import { logger } from '@/lib/logger'

function contactLabel(task: {
  title: string
  contact?: { firstName: string | null; lastName: string | null; email: string | null; phone: string | null } | null
}) {
  const name = [task.contact?.firstName, task.contact?.lastName].filter(Boolean).join(' ')
  return name || task.contact?.email || task.contact?.phone || task.title
}

export async function GET(req: NextRequest) {
  const authError = requireCronAuth(req)
  if (authError) return authError

  const now = new Date()

  try {
    const overdueTasks = await prisma.task.findMany({
      where: {
        dueAt: { lt: now },
        NOT: [
          { status: { equals: 'Completed', mode: 'insensitive' } },
          { status: { equals: 'Done', mode: 'insensitive' } },
          { status: { equals: 'Closed', mode: 'insensitive' } },
        ],
      },
      orderBy: { dueAt: 'asc' },
      take: 25,
      include: { contact: true, inquiry: true },
    })

    if (overdueTasks.length === 0) {
      return NextResponse.json({ ok: true, overdue: 0 })
    }

    const names = overdueTasks.map(task => `- ${contactLabel(task)}`)
    await sendGoogleChatMessage(`Overdue Leads:\n${names.join('\n')}\n\nImmediate follow-up required.`)

    await prisma.systemEvent.create({
      data: {
        type: 'lead.overdue_tasks.escalated',
        payload: {
          taskIds: overdueTasks.map(task => task.id),
          count: overdueTasks.length,
          channel: 'google_chat',
          checkedAt: now.toISOString(),
        },
      },
    })

    return NextResponse.json({ ok: true, overdue: overdueTasks.length })
  } catch (error) {
    logger.error({ err: error instanceof Error ? error.message : String(error) }, 'Overdue lead escalation failed')
    return NextResponse.json({ ok: false, error: 'overdue escalation failed' }, { status: 500 })
  }
}
