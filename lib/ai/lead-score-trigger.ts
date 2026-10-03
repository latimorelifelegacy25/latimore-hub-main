import { computeEnhancedLeadScore } from '@/lib/ai/lead-score-enhanced'
import { after } from 'next/server'
import { logger } from '@/lib/logger'

/**
 * Triggers automatic lead scoring when relevant events occur
 * This keeps the autopilot system running in real-time
 *
 * Scoring is deferred until after the response is sent via next/server `after`.
 * Must be called from a request context (route handler / server action).
 */
export async function triggerLeadScoring(input: {
  contactId?: string
  inquiryId?: string
  reason?: string
}) {
  try {
    after(async () => {
      try {
        await computeEnhancedLeadScore({
          contactId: input.contactId,
          inquiryId: input.inquiryId
        })

        logger.info({ contactId: input.contactId, inquiryId: input.inquiryId, reason: input.reason || 'unknown' }, 'Lead scoring triggered')
      } catch (error) {
        logger.error({ error }, 'Auto lead scoring failed')
      }
    })
  } catch (error) {
    // Don't let scoring failures break the main flow
    logger.error({ error }, 'Failed to trigger lead scoring')
  }
}

/**
 * Batch scoring for multiple contacts (useful for bulk operations).
 * Scores are computed (awaited) in small chunks to bound concurrency.
 */
export async function batchScoreLeads(contactIds: string[], reason?: string) {
  const CHUNK_SIZE = 3
  for (let i = 0; i < contactIds.length; i += CHUNK_SIZE) {
    const chunk = contactIds.slice(i, i + CHUNK_SIZE)
    const results = await Promise.allSettled(
      chunk.map(async (contactId) => {
        await computeEnhancedLeadScore({ contactId })
        logger.info({ contactId, reason: reason || 'unknown' }, 'Lead scoring completed')
      })
    )
    for (const result of results) {
      if (result.status === 'rejected') {
        logger.error({ error: result.reason }, 'Batch lead scoring failed')
      }
    }
  }
}
