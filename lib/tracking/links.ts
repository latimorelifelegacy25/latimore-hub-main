import { prisma } from '@/lib/prisma'
import { appendUtmParams } from '@/lib/tracking/url'

export const SLUG_PATTERN = /^[a-z0-9-]{3,40}$/

const PLACEHOLDER_ORIGIN = 'https://tracking-link.invalid'

type LinkUtms = {
  utmSource?: string | null
  utmMedium?: string | null
  utmCampaign?: string | null
  utmContent?: string | null
  utmTerm?: string | null
}

export type ResolvedLink = LinkUtms & {
  id: string
  slug: string
  destination: string
}

function siteOrigin(): string | null {
  try {
    return new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://www.latimorelifelegacy.com').origin
  } catch {
    return null
  }
}

function allowedHosts(): string[] {
  return (process.env.TRACKING_LINK_ALLOWED_HOSTS || '')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean)
}

function hasControlOrBackslash(value: string) {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i)
    if (code <= 0x1f || code === 0x5c || code === 0x7f) return true
  }
  return false
}

/**
 * Only same-site relative paths, the site's own origin, or hosts explicitly
 * listed in TRACKING_LINK_ALLOWED_HOSTS (default: none) may be redirect targets.
 */
export function isAllowedDestination(destination: unknown): boolean {
  if (typeof destination !== 'string') return false
  const value = destination.trim()
  if (!value || value.length > 2048 || hasControlOrBackslash(value)) return false

  if (value.startsWith('/')) {
    // Reject protocol-relative '//host' (and '/\host', blocked above).
    return !value.startsWith('//')
  }

  let url: URL
  try {
    url = new URL(value)
  } catch {
    return false
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return false
  if (url.username || url.password) return false

  if (url.origin === siteOrigin()) return true
  // The public site and hub share this business's tracking destinations.
  if (url.protocol === 'https:' && ['latimorelifelegacy.com', 'www.latimorelifelegacy.com', 'hub.latimorelifelegacy.com'].includes(url.hostname.toLowerCase())) return true
  return allowedHosts().includes(url.hostname.toLowerCase())
}

export async function resolveLink(slug: string): Promise<ResolvedLink | null> {
  if (!SLUG_PATTERN.test(slug)) return null
  const link = await prisma.trackingLink.findUnique({ where: { slug } })
  if (!link || !link.active) return null
  if (link.expiresAt && link.expiresAt.getTime() <= Date.now()) return null
  return link
}

/**
 * Destination with link-level UTMs added only for keys the destination does
 * not already carry. Relative destinations stay relative.
 */
export function buildDestination(link: ResolvedLink): string {
  const isRelative = link.destination.startsWith('/')
  const absolute = isRelative ? new URL(link.destination, PLACEHOLDER_ORIGIN) : new URL(link.destination)

  const existing = absolute.searchParams
  const missing: LinkUtms = {}
  const map: Array<[keyof LinkUtms, string]> = [
    ['utmSource', 'utm_source'],
    ['utmMedium', 'utm_medium'],
    ['utmCampaign', 'utm_campaign'],
    ['utmContent', 'utm_content'],
    ['utmTerm', 'utm_term'],
  ]
  for (const [field, key] of map) {
    if (!existing.has(key)) missing[field] = link[field]
  }

  const withUtms = new URL(appendUtmParams(absolute.toString(), missing))
  return isRelative ? `${withUtms.pathname}${withUtms.search}${withUtms.hash}` : withUtms.toString()
}
