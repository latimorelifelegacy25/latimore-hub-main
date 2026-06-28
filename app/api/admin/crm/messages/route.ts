export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { MessageDirection, MessageStatus, ThreadChannel } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAdminSession } from '@/lib/ai/shared'

function optionalString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function displayName(contact?: { fullName?: string | null; firstName?: string | null; lastName?: string | null; email?: string | null; phone?: string | null } | null) {
  if (!contact) return 'Unknown Sender'
  return contact.fullName || [contact.firstName, contact.lastName].filter(Boolean).join(' ') || contact.email || contact.phone || 'Unknown Sender'
}

export async function GET() {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  const messages = await prisma.conversationMessage.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { contact: true },
  })

  return NextResponse.json(
    messages.map((message) => ({
      id: message.id,
      fromName: displayName(message.contact),
      fromEmail: message.fromAddress ?? message.contact?.email ?? null,
      body: message.bodyText,
      createdAt: message.createdAt,
      status: message.status,
      direction: message.direction,
      channel: message.channel,
    })),
  )
}

export async function POST(req: Request) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  try {
    const data = await req.json()
    const body = optionalString(data?.body) ?? optionalString(data?.bodyText)
    const fromName = optionalString(data?.fromName) ?? 'Unknown Sender'
    const fromEmail = optionalString(data?.fromEmail) ?? optionalString(data?.email)
    const contactId = optionalString(data?.contactId)

    if (!body) {
      return NextResponse.json({ error: 'Message body is required' }, { status: 422 })
    }

    const created = await prisma.$transaction(async (tx) => {
      const contact = contactId
        ? await tx.contact.findUnique({ where: { id: contactId } })
        : fromEmail
          ? await tx.contact.upsert({
              where: { email: fromEmail },
              update: { fullName: fromName },
              create: { email: fromEmail, fullName: fromName },
            })
          : await tx.contact.create({ data: { fullName: fromName } })

      if (!contact) {
        throw new Error('Contact not found')
      }

      const thread = await tx.conversationThread.create({
        data: {
          contactId: contact.id,
          channel: ThreadChannel.email,
          lastMessageAt: new Date(),
          lastInboundAt: new Date(),
        },
      })

      return tx.conversationMessage.create({
        data: {
          threadId: thread.id,
          contactId: contact.id,
          direction: MessageDirection.inbound,
          channel: ThreadChannel.email,
          status: MessageStatus.received,
          bodyText: body,
          fromAddress: fromEmail,
          toAddress: optionalString(data?.toAddress),
        },
      })
    })

    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to save CRM message' }, { status: 500 })
  }
}
