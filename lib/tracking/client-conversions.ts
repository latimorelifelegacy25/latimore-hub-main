'use client'

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
    ttq?: { track?: (...args: unknown[]) => void }
    gtag?: (...args: unknown[]) => void
  }
}

export type LeadConversionInput = {
  eventId?: string | null
  value?: number
  currency?: string
  source?: string | null
  campaign?: string | null
  formName?: string
}

export function trackLeadConversion(input: LeadConversionInput = {}) {
  if (typeof window === 'undefined') return

  const eventId = input.eventId || `lead_${Date.now()}_${Math.random().toString(36).slice(2)}`
  const currency = input.currency || 'USD'
  const value = input.value ?? 0
  const formName = input.formName || 'lead_form'

  window.fbq?.(
    'track',
    'Lead',
    {
      content_name: formName,
      currency,
      value,
      source: input.source ?? undefined,
      campaign: input.campaign ?? undefined,
    },
    { eventID: eventId },
  )

  window.ttq?.track?.('SubmitForm', {
    content_name: formName,
    currency,
    value,
    source: input.source ?? undefined,
    campaign: input.campaign ?? undefined,
    event_id: eventId,
  })

  window.gtag?.('event', 'conversion', {
    event_category: 'lead',
    event_label: formName,
    currency,
    value,
    source: input.source ?? undefined,
    campaign: input.campaign ?? undefined,
    event_id: eventId,
  })
}
