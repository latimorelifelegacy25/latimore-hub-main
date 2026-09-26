import type { NextRequest } from 'next/server'

/** Cookie that marks a browser as the owner's/staff's, so its activity is not analytics. */
export const INTERNAL_TRAFFIC_COOKIE = 'll_internal'

const INTERNAL_PATH_PREFIXES = ['/admin', '/login', '/analytics', '/dashboard', '/crm', '/os', '/composer', '/leads']

// Automated browsers and AI/agent tooling: test runners, headless Chrome,
// crawlers, and command-line HTTP clients.
const AUTOMATION_UA =
  /headless|playwright|puppeteer|selenium|webdriver|phantomjs|lighthouse|pagespeed|bot\/|bot;|\+https?:|crawler|spider|slurp|facebookexternalhit|curl\/|wget\/|python-requests|python-urllib|aiohttp|httpx|node-fetch|axios\/|undici|go-http-client|okhttp|java\/|gptbot|chatgpt-user|claude|anthropic|perplexity|bytespider|ccbot/i

function privateHubHosts() {
  return (process.env.HUB_PRIVATE_HOSTS || 'hub.latimorelifelegacy.com')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean)
}

export function isInternalPath(pageUrl?: string | null) {
  const path = (pageUrl ?? '').split(/[?#]/)[0].toLowerCase()
  return INTERNAL_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
}

/**
 * Why a tracking request should not be recorded as visitor analytics, or null
 * when it is real visitor traffic.
 */
export function getExcludedTrafficReason(req: NextRequest, pageUrl?: string | null): string | null {
  if (req.cookies.get(INTERNAL_TRAFFIC_COOKIE)?.value === '1') return 'internal_browser'

  const host = (req.headers.get('host') || '').split(':')[0].toLowerCase()
  if (privateHubHosts().includes(host)) return 'hub_host'

  if (isInternalPath(pageUrl)) return 'internal_page'

  const userAgent = req.headers.get('user-agent') || ''
  if (!userAgent || AUTOMATION_UA.test(userAgent)) return 'automation'

  return null
}

/** Cookie domain that covers both the public site and the hub. */
export function internalCookieDomain(host: string) {
  const bare = host.split(':')[0].toLowerCase()
  return bare === 'latimorelifelegacy.com' || bare.endsWith('.latimorelifelegacy.com')
    ? '.latimorelifelegacy.com'
    : undefined
}
