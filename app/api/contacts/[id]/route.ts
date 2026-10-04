export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminSession } from '@/lib/ai/shared'
import { ContactPatchSchema } from '@/lib/schemas'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminSession()
    if (!auth.ok) return auth.response

    const { id } = await params
    const parsed = ContactPatchSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 422 })
    }
    const { status, notes } = parsed.data

    const existing = status
      ? await prisma.contact.findUnique({ where: { id }, select: { status: true } })
      : await prisma.contact.findUnique({ where: { id }, select: { id: true } })

    if (!existing) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (status) updateData.status = status
    if (notes) updateData.notesSummary = notes

    const contact = await prisma.contact.update({
      where: { id },
      data: updateData,
    })

    if (status && 'status' in existing) {
      await prisma.systemEvent.create({
        data: {
          type: 'contact.status_changed',
          contactId: contact.id,
          payload: {
            oldStatus: existing.status,
            newStatus: status,
          },
        },
      })
    }

    return NextResponse.json({ success: true, contact })
  } catch (error) {
    console.error('Contact update error:', error)
    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    )
  }
}