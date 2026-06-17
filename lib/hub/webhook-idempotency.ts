import { prisma } from '@/lib/prisma'

/**
 * Atomically claims a webhook event by provider + id. Returns `true` if this
 * call is the first to see the event (caller should proceed with ingestion),
 * or `false` if it has already been processed (caller should short-circuit
 * and return success without re-ingesting). Relies on a unique constraint
 * so concurrent retries can't both win the race.
 */
export async function claimWebhookEvent(provider: string, eventId: string): Promise<boolean> {
  try {
    await prisma.processedWebhook.create({ data: { provider, eventId } })
    return true
  } catch (err: any) {
    if (err?.code === 'P2002') return false
    throw err
  }
}
