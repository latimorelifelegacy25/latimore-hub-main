export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminSession } from '@/lib/ai/shared'

const DEFAULT_STATUS = 'draft'
const DEFAULT_TYPE = 'post'

function optionalString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export async function POST(req: Request) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  try {
    const data = await req.json()
    const title = optionalString(data?.title)

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 422 })
    }

    const created = await prisma.marketingContent.create({
      data: {
        title,
        bodyHtml: typeof data?.bodyHtml === 'string' ? data.bodyHtml : '',
        campaign: optionalString(data?.campaign),
        destination: optionalString(data?.destination),
        utmSource: optionalString(data?.utmSource),
        type: optionalString(data?.type) ?? DEFAULT_TYPE,
        status: optionalString(data?.status) ?? DEFAULT_STATUS,
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to save content' }, { status: 500 })
  }
}
