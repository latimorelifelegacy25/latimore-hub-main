export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { triggerLeadScoring } from '@/lib/ai/lead-score-trigger'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const from = formData.get('From') as string
  const to = formData.get('To') as string
  const body = formData.get('Body') as string
  const messageSid = formData.get('MessageSid') as string

  if (!from || !body) {
    return new NextResponse('Missing required fields', { status: 400 })
  }

  try {
    // Find contact by phone number
    const contact = await prisma.contact.findFirst({
      where: { phone: from.replace(/^\+?1/, '') }, // Remove +1 prefix for US numbers
      include: { inquiries: { orderBy: { createdAt: 'desc' }, take: 1 } }
    })

    if (!contact) {
      console.log(`Inbound SMS from unknown number: ${from}`)
      return new NextResponse('', { status: 200 }) // Acknowledge but don't process
    }

    // Find or create conversation thread
    let thread = await prisma.conversationThread.findFirst({
      where: { contactId: contact.id, channel: 'sms' },
      orderBy: { updatedAt: 'desc' },
    })

    if (!thread) {
      thread = await prisma.conversationThread.create({
        data: {
          contactId: contact.id,
          inquiryId: contact.inquiries[0]?.id ?? null,
          channel: 'sms',
          subject: 'SMS Conversation',
          lastMessageAt: new Date(),
          lastInboundAt: new Date(),
        },
      })
    }

    // Save the inbound message
    const message = await prisma.conversationMessage.create({
      data: {
        threadId: thread.id,
        contactId: contact.id,
        inquiryId: contact.inquiries[0]?.id ?? null,
        channel: 'sms',
        direction: 'inbound',
        status: 'received',
        bodyText: body,
        providerMessageId: messageSid,
        sentAt: new Date(),
        fromAddress: from,
        toAddress: to,
      },
    })

    // Update thread and contact
    await prisma.conversationThread.update({
      where: { id: thread.id },
      data: { lastMessageAt: new Date(), lastInboundAt: new Date() },
    })

    await prisma.contact.update({
      where: { id: contact.id },
      data: { lastActivityAt: new Date() },
    })

    // Log the inbound message event
    await prisma.systemEvent.create({
      data: {
        type: 'message.received',
        contactId: contact.id,
        inquiryId: contact.inquiries[0]?.id ?? null,
        payload: { channel: 'sms', messageId: message.id }
      }
    })

    // Trigger lead scoring for inbound message
    await triggerLeadScoring({
      contactId: contact.id,
      inquiryId: contact.inquiries[0]?.id ?? null,
      reason: 'inbound_sms_received'
    })

    // Return empty response to acknowledge receipt
    return new NextResponse('', { status: 200 })

  } catch (error) {
    console.error('Twilio webhook error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}