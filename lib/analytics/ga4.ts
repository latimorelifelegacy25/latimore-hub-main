declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

function track(event: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !window.gtag) return
  window.gtag('event', event, params)
}

export const ga4 = {
  dashboardView: (dashboard: string) =>
    track('dashboard_view', { dashboard }),

  ctaClick: (label: string) =>
    track('cta_click', { event_category: 'lead_generation', event_label: label }),

  formSubmit: (source: string) =>
    track('form_submit', { event_category: 'lead_capture', source }),

  socialPostClick: (platform: string, campaign?: string) =>
    track('social_post_click', { platform, campaign }),

  insightViewed: (type: string, severity: string) =>
    track('insight_viewed', { insight_type: type, severity }),

  reportGenerated: (reportType: string) =>
    track('report_generated', { report_type: reportType }),

  sentimentAnalyzed: (platform: string, sentiment: string) =>
    track('sentiment_analyzed', { platform, sentiment }),
}
