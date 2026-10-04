import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

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

/**
 * Releases a claim made by `claimWebhookEvent` so a provider retry is processed
 * instead of being dropped as a duplicate. Call this from the route's failure
 * path (catch block) when processing failed after the claim succeeded.
 * Never throws: a failed release only means the retry will be deduped, which is
 * the pre-existing behavior.
 */
export async function releaseWebhookClaim(provider: string, eventId: string): Promise<void> {
  try {
    await prisma.processedWebhook.deleteMany({ where: { provider, eventId } })
  } catch {
    // best effort
  }
}

/**
 * Takes transaction-scoped Postgres advisory locks (released automatically at
 * commit/rollback; pgbouncer transaction-pooling safe) for the given identity
 * keys. Keys are de-duplicated and locked in sorted order so overlapping
 * multi-key callers cannot deadlock. hashtext() collisions only cause extra
 * serialization, never incorrect behavior. Must be called inside a transaction.
 */
export async function acquireIdentityLocks(
  tx: Prisma.TransactionClient,
  keys: Array<string | null | undefined>,
): Promise<void> {
  const unique = Array.from(new Set(keys.filter((k): k is string => Boolean(k)))).sort()
  for (const key of unique) {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key})::bigint)`
  }
}
