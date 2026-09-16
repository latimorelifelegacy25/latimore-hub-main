'use client'

import { getCurrentPageUrl, getEventContext, hydrateLeadContext } from '@/lib/lead'

export type LatimoreEventAction =
  | 'tool_opened'
  | 'tool_started'
  | 'tool_step_completed'
  | 'tool_completed'
  | 'tool_result_viewed'
  | 'tool_cta_clicked'
  | 'quiz_answered'
  | 'search_performed'
  | 'lead_submitted'
  | 'booking_clicked'
  | 'referral_clicked'

export type LatimoreEventInput = {
  action: LatimoreEventAction
  tool: string
  category: string
  step?: string | number | null
  resultBand?: string | null
  eventType?: string
  metadata?: Record<string, unknown>
}

function canonicalEventType(action: LatimoreEventAction): string {
  switch (action) {
    case 'tool_opened':
    case 'tool_started':
      return 'legacy_checkup_started'
    case 'tool_step_completed':
    case 'tool_result_viewed':
      return 'legacy_checkup_step_completed'
    case 'tool_completed':
      return 'legacy_checkup_completed'
    case 'quiz_answered':
    case 'search_performed':
      return 'product_selected'
    case 'lead_submitted':
      return 'lead_submitted'
    case 'booking_clicked':
      return 'book_consultation_clicked'
    case 'tool_cta_clicked':
    case 'referral_clicked':
    default:
      return 'cta_click'
  }
}

/**
 * Canonical first-party client tracker for Latimore public and advisor tools.
 *
 * - Persists to the existing /api/event pipeline (Supabase/Prisma source of truth).
 * - Carries attribution through the existing LeadSession context.
 * - Uses carrier-neutral, solution-level metadata.
 * - Never sends client financial/health answer values to external analytics.
 */
export async function trackLatimoreEvent(input: LatimoreEventInput) {
  try {
    hydrateLeadContext()
    const context = getEventContext({ pageUrl: getCurrentPageUrl() })

    await fetch('/api/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...context,
        eventType: input.eventType || canonicalEventType(input.action),
        metadata: {
          latimoreEvent: input.action,
          tool: input.tool,
          category: input.category,
          step: input.step ?? null,
          resultBand: input.resultBand ?? null,
          ...(input.metadata ?? {}),
        },
      }),
      keepalive: true,
      cache: 'no-store',
    })
  } catch {
    // Analytics must never block the client or advisor workflow.
  }
}
