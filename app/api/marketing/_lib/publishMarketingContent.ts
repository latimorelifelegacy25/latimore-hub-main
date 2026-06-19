import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminSession } from '@/lib/ai/shared'

export async function publishMarketingContent(req: Request) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  try {
    const { id } = await req.json()

    if (typeof id !== 'string' || !id.trim()) {
      return NextResponse.json({ error: 'Content id is required' }, { status: 422 })
    }

    const updated = await prisma.marketingContent.update({
      where: { id },
      data: { status: 'published' },
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to publish content' }, { status: 500 })
  }
}
