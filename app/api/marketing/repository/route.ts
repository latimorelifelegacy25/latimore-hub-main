import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const items = await prisma.marketingContent.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(items)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to load repository' }, { status: 500 })
  }
}
