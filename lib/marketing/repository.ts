// Content Repository: shared constants + UTM/campaign/slug logic.
// Ported from the Claude Design handoff (data.jsx) — this is the "real,
// working" logic the handoff spec calls out; lifted as-is per its guidance.

export type UtmSet = {
  source?: string | null
  medium?: string | null
  campaign?: string | null
  content?: string | null
}

export const UTM_SOURCES = [
  { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'email', label: 'Email' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'sms', label: 'SMS / Text' },
  { id: 'qr', label: 'QR Code (print)' },
  { id: 'google', label: 'Google Ads' },
] as const

export const UTM_MEDIUMS = [
  { id: 'social', label: 'social' },
  { id: 'email', label: 'email' },
  { id: 'cpc', label: 'cpc' },
  { id: 'referral', label: 'referral' },
  { id: 'qr', label: 'qr' },
  { id: 'banner', label: 'banner' },
  { id: 'organic', label: 'organic' },
] as const

// Destinations on the Latimore site (real CMS/route sections)
export const DESTINATIONS = [
  { id: 'blog', label: 'The Beat — Blog', path: '/blog' },
  { id: 'education', label: 'Education Center', path: '/education' },
  { id: 'resources', label: 'Resources Library', path: '/resources' },
  { id: 'newsletter', label: 'Newsletter Archive', path: '/newsletter' },
] as const

export const CATEGORIES = [
  { id: 'medicare', label: 'Medicare' },
  { id: 'life-insurance', label: 'Life Insurance' },
  { id: 'final-expense', label: 'Final Expense' },
  { id: 'living-benefits', label: 'Living Benefits' },
  { id: 'retirement', label: 'Retirement & Annuities' },
  { id: 'family-legacy', label: 'Family & Legacy' },
  { id: 'company-news', label: 'Company News' },
] as const

export const TYPES = {
  article: { label: 'Article', color: 'gold' },
  link: { label: 'Link', color: 'navy' },
  pdf: { label: 'PDF', color: 'rust' },
  doc: { label: 'Doc', color: 'gold' },
  video: { label: 'Video', color: 'teal' },
} as const

export type ContentType = keyof typeof TYPES
export type ContentStatus = 'draft' | 'published' | 'scheduled'

export function buildUrl(base: string, utm: UtmSet): string {
  try {
    const u = new URL(base)
    ;(['source', 'medium', 'campaign', 'content'] as const).forEach((k) => {
      if (utm[k]) u.searchParams.set('utm_' + k, utm[k] as string)
    })
    return u.toString()
  } catch {
    const params = (['source', 'medium', 'campaign', 'content'] as const)
      .filter((k) => utm[k])
      .map((k) => `utm_${k}=${encodeURIComponent(utm[k] as string)}`)
      .join('&')
    return base + (params ? (base.includes('?') ? '&' : '?') + params : '')
  }
}

// Auto-generate a consistent kebab campaign name
export function autoCampaign(topic: string | null | undefined, source: string | null | undefined): string {
  const year = new Date().getFullYear()
  const seed = (topic || 'general').toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const src = (source || 'web').toLowerCase()
  return `latimore-${seed}-${src}-${year}`
}

export function slugify(s: string | null | undefined): string {
  return (
    (s || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'untitled'
  )
}

// Pull href values out of authored HTML so we can show which links get tagged
export function extractLinks(html: string | null | undefined): string[] {
  if (!html) return []
  const out: string[] = []
  const re = /href="([^"]+)"/g
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    if (/^https?:/i.test(m[1]) && !out.includes(m[1])) out.push(m[1])
  }
  return out
}

export function guessTitleFromUrl(url: string): string {
  try {
    const u = new URL(url)
    const seg = u.pathname.split('/').filter(Boolean).pop() || u.hostname
    return seg
      .replace(/[-_]+/g, ' ')
      .replace(/\.\w+$/, '')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  } catch {
    return ''
  }
}

export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

export function typeFromUrl(url: string): ContentType {
  if (/youtu\.?be|vimeo|\.mp4|wistia/i.test(url)) return 'video'
  if (/\.pdf($|\?)/i.test(url)) return 'pdf'
  if (/docs\.google|\.docx?($|\?)/i.test(url)) return 'doc'
  return 'link'
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return ''
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
