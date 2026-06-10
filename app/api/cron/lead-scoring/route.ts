export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { computeEnhancedLeadScore } from '@/lib/ai/lead-score-enhanced'
import { requireCronAuth } from '@/lib/ai/shared'

const DEFAULT_BATCH_SIZE = 25
const DEFAULT_CONCURRENCY = 3

async function runWithConcurrency<T>(items: T[], concurrency: number, worker: (item: T) => Promise<void>) {
  let index = 0
  let errors = 0
  let completed = 0

  async function next() {
    while (index < items.length) {
      const currentIndex = index++
      try {
        await worker(items[currentIndex])
        completed++
      } catch (error) {
        console.error('Lead scoring item failed:', error)
        errors++
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => next()))
  return { completed, errors }
}

export async function GET(req: NextRequest) {
  const authError = requireCronAuth(req)
  if (authError) return authError

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const batchSizeParam = req.nextUrl.searchParams.get('limit')
    const batchSize = batchSizeParam
      ? Math.min(100, Math.max(1, parseInt(batchSizeParam, 10) || DEFAULT_BATCH_SIZE))
      : DEFAULT_BATCH_SIZE

    const contacts = await prisma.contact.findMany({
      where: {
        OR: [
          { lastActivityAt: { gte: thirtyDaysAgo } },
          { inquiries: { some: { stage: { not: 'Lost' } } } },
          { leadScore: { gte: 50 } },
        ]
      },
      orderBy: [
        { lastActivityAt: 'desc' },
        { updatedAt: 'desc' },
      ],
      take: batchSize,
      select: { id: true, firstName: true, lastName: true },
    })

    const { completed: scored, errors } = await runWithConcurrency(
      contacts,
      DEFAULT_CONCURRENCY,
      async contact => {
        await computeEnhancedLeadScore({ contactId: contact.id })
      }
    )

    await prisma.systemEvent.create({
      data: {
        type: 'cron.lead_scoring.completed',
        payload: {
          contactsProcessed: scored,
          errors,
          totalContacts: contacts.length,
          batchSize,
          concurrency: DEFAULT_CONCURRENCY,
        }
      }
    })

    return NextResponse.json({
      ok: true,
      message: `Lead scoring completed: ${scored} contacts scored, ${errors} errors`,
      stats: { scored, errors, total: contacts.length, batchSize, concurrency: DEFAULT_CONCURRENCY }
    })

  } catch (error) {
    console.error('Lead scoring cron failed:', error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
