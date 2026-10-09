function browserSafeUUID(): string {
  if (typeof window === 'undefined') return ''
  return (self as any).crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)
}

const LEAD_SESSION_KEY = 'lead_session_id'
const LEAD_ATTRIBUTION_KEY = 'lead_attribution_v1'
const LEAD_SESSION_PATTERN = /^[A-Za-z0-9._:-]{1,191}$/

type StoredAttribution = Partial<{
  utm_source: string
  utm_medium: string
  utm_campaign: string
  utm_term: string
  utm_content: string
  referrer: string
  attribution_inferred: string
  entry_page: string
  last_page: string
}>

function safeStorageGet(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeStorageSet(key: string, value: string) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // ignore storage failures in private browsing / restricted environments
  }
}

function readStoredAttribution(): StoredAttribution {
  const raw = safeStorageGet(LEAD_ATTRIBUTION_KEY)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as StoredAttribution
  } catch {
    return {}
  }
}

function writeStoredAttribution(value: StoredAttribution) {
  safeStorageSet(LEAD_ATTRIBUTION_KEY, JSON.stringify(value))
}

function isExternalReferrer(referrer: string): boolean {
  if (typeof window === 'undefined' || !referrer) return false
  try {
    return new URL(referrer).origin !== window.location.origin
  } catch {
    return false
  }
}

const SEARCH_HOSTS = /(^|\.)(google|bing|duckduckgo|yahoo|ecosia|search\.brave)\./i
const SOCIAL_HOSTS: Array<[RegExp, string]> = [
  [/(^|\.)(facebook\.com|fb\.com|l\.facebook\.com|m\.facebook\.com)$/i, 'facebook'],
  [/(^|\.)(instagram\.com|l\.instagram\.com)$/i, 'instagram'],
  [/(^|\.)(linkedin\.com|lnkd\.in)$/i, 'linkedin'],
  [/(^|\.)(t\.co|twitter\.com|x\.com)$/i, 'twitter'],
]

// Untagged traffic would otherwise leave source/medium empty. Infer a coarse
// channel from the referrer so first-touch attribution is never blank.
function inferChannel(referrer: string): { source: string; medium: string } {
  if (!referrer) return { source: 'direct', medium: 'none' }
  try {
    const host = new URL(referrer).hostname
    const social = SOCIAL_HOSTS.find(([pattern]) => pattern.test(host))
    if (social) return { source: social[1], medium: 'social' }
    if (SEARCH_HOSTS.test(host)) return { source: host.replace(/^www\./, '').split('.')[0], medium: 'organic' }
    return { source: host.replace(/^www\./, ''), medium: 'referral' }
  } catch {
    return { source: 'direct', medium: 'none' }
  }
}

function incomingLeadSessionId(): string | null {
  if (typeof window === 'undefined') return null
  const candidate = new URLSearchParams(window.location.search).get('lead_session_id')?.trim() || ''
  return LEAD_SESSION_PATTERN.test(candidate) ? candidate : null
}

export function getCurrentPageUrl(): string {
  if (typeof window === 'undefined') return ''
  const search = window.location.search || ''
  return `${window.location.pathname}${search}`
}

// Client-side lead session ID (persisted in localStorage). A validated session
// supplied by the QR redirect takes precedence so scan, page view, and form
// submission remain attached to the same acquisition session.
export function ensureLeadSessionId(): string {
  if (typeof window === 'undefined') return ''

  const incoming = incomingLeadSessionId()
  if (incoming) {
    safeStorageSet(LEAD_SESSION_KEY, incoming)
    return incoming
  }

  let value = safeStorageGet(LEAD_SESSION_KEY)
  if (!value || !LEAD_SESSION_PATTERN.test(value)) {
    value = `sess_${browserSafeUUID()}`
    safeStorageSet(LEAD_SESSION_KEY, value)
  }
  return value
}

// Capture UTM params from current URL and persist them so attribution survives
// page-to-page navigation until the visitor becomes a lead.
export function captureUtms(): Record<string, string> {
  if (typeof window === 'undefined') return {}

  const params = new URLSearchParams(window.location.search)
  const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const
  const current: Record<string, string> = {}
  const stored = readStoredAttribution()

  for (const key of keys) {
    const value = params.get(key)?.trim()
    if (value) current[key] = value
  }

  const explicitReferrer = params.get('referrer')?.trim()
  const documentReferrer = typeof document !== 'undefined' ? document.referrer : ''
  const referrer = explicitReferrer || (isExternalReferrer(documentReferrer) ? documentReferrer : '')
  if (referrer) current.referrer = referrer

  const pageUrl = getCurrentPageUrl()
  const next: StoredAttribution = { ...stored }

  // An explicit UTM tag always beats an earlier inferred (referrer/direct) channel.
  if (current.utm_source && next.attribution_inferred) {
    for (const key of keys) delete next[key]
    delete next.attribution_inferred
  }

  for (const key of keys) {
    const value = current[key]
    if (value && !next[key]) next[key] = value
  }

  if (current.referrer && !next.referrer) next.referrer = current.referrer

  if (!next.utm_source || next.attribution_inferred) {
    const channel = inferChannel(next.referrer ?? '')
    next.utm_source = channel.source
    next.utm_medium = channel.medium
    next.attribution_inferred = '1'
  }
  if (!next.entry_page) next.entry_page = pageUrl
  next.last_page = pageUrl

  writeStoredAttribution(next)

  return Object.fromEntries(
    Object.entries(next).filter(([, value]) => typeof value === 'string' && value.length > 0)
  ) as Record<string, string>
}

export function getStoredLeadAttribution(): Record<string, string> {
  const stored = readStoredAttribution()
  return Object.fromEntries(
    Object.entries(stored).filter(([, value]) => typeof value === 'string' && value.length > 0)
  ) as Record<string, string>
}

export function hydrateLeadContext(overrides: Partial<{
  pageUrl: string
  referrer: string
}> = {}) {
  ensureLeadSessionId()
  const stored = captureUtms()

  return {
    leadSessionId: ensureLeadSessionId(),
    pageUrl: overrides.pageUrl ?? getCurrentPageUrl(),
    referrer: overrides.referrer ?? stored.referrer ?? null,
    source: stored.utm_source ?? null,
    medium: stored.utm_medium ?? null,
    campaign: stored.utm_campaign ?? null,
    term: stored.utm_term ?? null,
    content: stored.utm_content ?? null,
  }
}

export function getEventContext(overrides: Partial<{
  pageUrl: string
  source: string
  medium: string
  campaign: string
  term: string
  content: string
  referrer: string
  county: string
  productInterest: string
}> = {}) {
  const context = hydrateLeadContext({ pageUrl: overrides.pageUrl, referrer: overrides.referrer })

  return {
    leadSessionId: context.leadSessionId,
    pageUrl: overrides.pageUrl ?? context.pageUrl ?? null,
    source: overrides.source ?? context.source ?? null,
    medium: overrides.medium ?? context.medium ?? null,
    campaign: overrides.campaign ?? context.campaign ?? null,
    term: overrides.term ?? context.term ?? null,
    content: overrides.content ?? context.content ?? null,
    referrer: overrides.referrer ?? context.referrer ?? null,
    county: overrides.county ?? null,
    productInterest: overrides.productInterest ?? null,
  }
}

// Build hidden field string for Fillout embed
export function buildFilloutParams(extra: Record<string, string> = {}): string {
  const context = getEventContext()
  const params = {
    lead_session_id: context.leadSessionId,
    utm_source: context.source ?? '',
    utm_medium: context.medium ?? '',
    utm_campaign: context.campaign ?? '',
    utm_term: context.term ?? '',
    utm_content: context.content ?? '',
    referrer: context.referrer ?? '',
    page_url: context.pageUrl ?? '',
    ...extra,
  }

  return new URLSearchParams(
    Object.entries(params).filter(([, value]) => value)
  ).toString()
}
