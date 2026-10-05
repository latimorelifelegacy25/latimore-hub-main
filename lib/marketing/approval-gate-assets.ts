import type { ContentAsset, MarketingContent } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { createNotification } from '@/lib/notifications'
import { evaluatePublishGate, stripHtml, type PublishGateResult } from './approval-gate'

export type GateItemKind = 'content_asset' | 'social_post' | 'marketing_content' | 'social_publish_job'

/** Warn mode: record that enforce mode would have blocked. Ids only; best-effort. */
export async function auditGate(kind: GateItemKind, id: string | null, gate: PublishGateResult): Promise<void> {
  if (!gate.wouldHaveBlocked) return
  try {
    await prisma.systemEvent.create({
      data: { type: 'content.publish_gate_warned', payload: { kind, itemId: id, rules: gate.blockedRules } },
    })
  } catch (err) {
    logger.error({ kind, itemId: id, err: err instanceof Error ? err.message : String(err) }, '[approval-gate] failed to record warned event')
  }
  logger.warn({ kind, itemId: id }, '[approval-gate] warn mode: would have blocked')
}

/** Persisted, deduped admin notification for a held scheduled item. Generic text, best-effort. */
export async function notifyHeld(kind: GateItemKind, id: string, gate: PublishGateResult): Promise<void> {
  try {
    const rule = gate.blockedRules[0]
    const reason = rule ? `critical compliance rule ${rule}` : 'publish gate check'
    await createNotification({
      type: 'system',
      priority: 'high',
      title: 'Scheduled item held by publish approval gate',
      message: `${kind} ${id} held by publish approval gate: ${reason}`,
      data: { kind, itemId: id, rules: gate.blockedRules },
      dedupeKey: `publish_blocked:${id}`,
    })
  } catch (err) {
    logger.error({ kind, itemId: id, err: err instanceof Error ? err.message : String(err) }, '[approval-gate] failed to create hold notification')
  }
}

export async function gateContentAsset(asset: ContentAsset): Promise<PublishGateResult> {
  const gate = evaluatePublishGate({
    text: [asset.title, asset.bodyText ?? stripHtml(asset.bodyHtml ?? '')].filter(Boolean).join('\n'),
    status: asset.status,
    campaign: asset.campaign,
  })
  await auditGate('content_asset', asset.id, gate)
  return gate
}

/**
 * Skip a blocked scheduled asset without deleting it: return it to `draft`
 * (so it is not re-selected every run) and record why in metadata.
 * Logs ids only.
 */
export async function holdBlockedAsset(asset: ContentAsset, gate: PublishGateResult): Promise<void> {
  const meta =
    asset.metadata && typeof asset.metadata === 'object' && !Array.isArray(asset.metadata)
      ? (asset.metadata as Record<string, unknown>)
      : {}
  try {
    await prisma.contentAsset.update({
      where: { id: asset.id },
      data: {
        status: 'draft',
        metadata: { ...meta, publishBlocked: { at: new Date().toISOString(), blockers: gate.blockers } },
      },
    })
  } catch (err) {
    logger.error({ assetId: asset.id, err: err instanceof Error ? err.message : String(err) }, '[approval-gate] failed to mark blocked asset')
  }
  logger.warn({ assetId: asset.id }, '[approval-gate] scheduled asset blocked and skipped')
  await notifyHeld('content_asset', asset.id, gate)
}

/** Statuses a human may publish a Content Repository item from (republish allowed). */
export const MARKETING_MANUAL_STATUSES = ['draft', 'review', 'approved', 'scheduled', 'published'] as const

export async function gateMarketingContent(
  item: Pick<MarketingContent, 'id' | 'title' | 'bodyHtml' | 'status' | 'campaign' | 'utmSource' | 'sourceUrl'>,
  allowedStatuses?: readonly string[],
): Promise<PublishGateResult> {
  const gate = evaluatePublishGate({
    text: [item.title, stripHtml(item.bodyHtml ?? '')].filter(Boolean).join('\n'),
    status: item.status,
    allowedStatuses,
    campaign: item.campaign,
    utmSource: item.utmSource,
    hasSource: Boolean(item.sourceUrl),
  })
  await auditGate('marketing_content', item.id || null, gate)
  return gate
}
