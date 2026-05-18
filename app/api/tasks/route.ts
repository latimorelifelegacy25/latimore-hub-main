export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  const limited = rateLimit(req, 'default')
  if (limited) return limited

  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const items = await prisma.task.findMany({
    orderBy: { dueAt: 'asc' },
    include: { contact: true, inquiry: true },
  })
  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, 'default')
  if (limited) return limited

  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  try {
    const { title, description, dueAt, contactId, inquiryId } = await req.json()
    if (!title?.trim()) return NextResponse.json({ error: 'title is required' }, { status: 400 })

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        dueAt: dueAt ? new Date(dueAt) : null,
        contactId: contactId || null,
        inquiryId: inquiryId || null,
      },
      include: { contact: true },
    })
    return NextResponse.json({ task }, { status: 201 })
  } catch (err) {
    console.error('Task POST error:', err)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const limited = rateLimit(req, 'default')
  if (limited) return limited

  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  try {
    const { id, status, title, description, dueAt } = await req.json()
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const data: Record<string, unknown> = {}
    if (status !== undefined) data.status = status
    if (title !== undefined) data.title = title.trim()
    if (description !== undefined) data.description = description?.trim() || null
    if (dueAt !== undefined) data.dueAt = dueAt ? new Date(dueAt) : null

    const task = await prisma.task.update({
      where: { id },
      data,
      include: { contact: true },
    })
    return NextResponse.json({ task })
  } catch (err) {
    console.error('Task PATCH error:', err)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}
