import { NextRequest, NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/ai/shared'
import { prisma } from '@/lib/prisma'
import { syncContactToNotion } from '@/lib/notion/sync-contact'

export const dynamic = 'force-dynamic'

// GET /api/admin/notion-sync — returns contact count and Notion config status
export async function GET() {
  const session = await requireAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const total = await prisma.contact.count()
  const configured = Boolean(process.env.NOTION_API_KEY && process.env.NOTION_CONTACT_DB_ID)
  const workerConfigured = Boolean(process.env.LATIMORE_NOTION_WORKER_URL)

  return NextResponse.json({ total, configured, workerConfigured })
}

// POST /api/admin/notion-sync — trigger a full backfill of all contacts to Notion
export async function POST(req: NextRequest) {
  const session = await requireAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.NOTION_API_KEY || !process.env.NOTION_CONTACT_DB_ID) {
    return NextResponse.json({ error: 'Notion not configured (missing NOTION_API_KEY or NOTION_CONTACT_DB_ID)' }, { status: 400 })
  }

  // Run sync in background — stream progress via a simple count response
  const PAGE_SIZE = 50
  let synced = 0
  let page = 0
  let hasMore = true

  while (hasMore) {
    const contacts = await prisma.contact.findMany({
      include: { inquiries: { orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { createdAt: 'asc' },
      skip: page * PAGE_SIZE,
      take: PAGE_SIZE,
    })

    for (const contact of contacts) {
      try {
        await syncContactToNotion(contact, contact.inquiries[0] ?? null)
        synced++
      } catch {
        // skip failed individual contact
      }
    }

    hasMore = contacts.length === PAGE_SIZE
    page++
  }

  return NextResponse.json({ ok: true, synced })
}
