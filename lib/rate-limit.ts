import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'

// Limit config shared by both the Upstash and in-memory implementations.
const LIMITS: Record<string, { limit: number; windowSec: number }> = {
  analytics: { limit: 120, windowSec: 60 },
  booking: { limit: 10, windowSec: 60 },
  cardEvents: { limit: 200, windowSec: 60 },
  chat: { limit: 10, windowSec: 60 },
  fillout: { limit: 20, windowSec: 60 },
  intake: { limit: 20, windowSec: 60 },
  inquiries: { limit: 60, windowSec: 60 },
  reports: { limit: 30, windowSec: 60 },
  event: { limit: 120, windowSec: 60 },
  lead: { limit: 30, windowSec: 60 },
  join: { limit: 10, windowSec: 60 },
  ethos_redirect: { limit: 60, windowSec: 60 },
  default: { limit: 100, windowSec: 60 },
}

const upstashLimiters = new Map<string, Ratelimit>()

// Env values here have historically arrived mangled from the Vercel dashboard
// (extra quotes, smart quotes, or both `URL=`/`TOKEN=` lines pasted into one
// field). Recover the usable parts instead of crashing every guarded route.
function getUpstashConfig(): { url: string; token: string } | null {
  const rawUrl = process.env.UPSTASH_REDIS_REST_URL ?? ''
  const rawToken = process.env.UPSTASH_REDIS_REST_TOKEN ?? ''

  const url = rawUrl.match(/https:\/\/[^\s"'“”‘’]+/)?.[0] ?? ''

  let token = rawToken.replace(/["'“”‘’\s]/g, '')
  if (!token) {
    token = rawUrl.match(/UPSTASH_REDIS_REST_TOKEN=["'“”‘’]?([^\s"'“”‘’]+)/)?.[1] ?? ''
  }

  if (!url || !token) return null
  return { url, token }
}

let warnedUpstashFailure = false

function getUpstashLimiter(limit: number, windowSec: number): Ratelimit | null {
  const config = getUpstashConfig()
  if (!config) return null

  const key = `${limit}:${windowSec}`
  const cached = upstashLimiters.get(key)
  if (cached) return cached

  try {
    const redis = new Redis({ url: config.url, token: config.token })
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
    })
    upstashLimiters.set(key, limiter)
    return limiter
  } catch (error) {
    if (!warnedUpstashFailure) {
      warnedUpstashFailure = true
      console.error('[rate-limit] Upstash client init failed; falling back to in-memory limiting. Check UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN.', error)
    }
    return null
  }
}

async function upstashLimit(key: string, limit: number, windowSec: number): Promise<boolean | null> {
  const limiter = getUpstashLimiter(limit, windowSec)
  if (!limiter) return null

  try {
    const { success } = await limiter.limit(key)
    return !success
  } catch {
    // Backend hiccup — let the in-memory fallback keep some protection
    // instead of hard-failing or blanket-blocking every request.
    return null
  }
}

// In-memory fallback (single-instance only — used when Upstash is not configured or unavailable).
const store = new Map<string, { count: number; reset: number }>()

// Periodically evict expired entries to prevent unbounded memory growth.
setInterval(() => {
  const now = Date.now()
  for (const [k, rec] of store) {
    if (now > rec.reset) store.delete(k)
  }
}, 60_000)

function memoryLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const rec = store.get(key)
  if (!rec || now > rec.reset) {
    store.set(key, { count: 1, reset: now + windowMs })
    return false
  }
  if (rec.count >= limit) return true
  rec.count++
  return false
}

function getLimitConfig(type = 'default') {
  return LIMITS[type] ?? LIMITS.default
}

function sanitizeIdentifierPart(value?: string | null) {
  if (!value) return 'unknown'
  return value.trim().toLowerCase().replace(/[^a-z0-9:._-]+/g, '_').slice(0, 160) || 'unknown'
}

export function getClientIp(req: Pick<NextRequest, 'headers'>) {
  return (
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-real-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  )
}

export function getClientFingerprint(req: Pick<NextRequest, 'headers'>) {
  const ip = sanitizeIdentifierPart(getClientIp(req))
  const ua = sanitizeIdentifierPart(req.headers.get('user-agent'))
  return `${ip}:${ua}`
}

function buildRateLimitKey(req: NextRequest, type: string, identifier?: string) {
  return `rl:${type}:${sanitizeIdentifierPart(identifier) || sanitizeIdentifierPart(getClientIp(req))}`
}

export function createRateLimitResponse(
  type = 'default',
  body: Record<string, unknown> = { ok: false, error: 'Too many requests — please slow down.' },
) {
  const { limit, windowSec } = getLimitConfig(type)
  return NextResponse.json(body, {
    status: 429,
    headers: {
      'Cache-Control': 'no-store',
      'Retry-After': String(windowSec),
      'X-RateLimit-Limit': String(limit),
    },
  })
}

export async function isRateLimited(
  req: NextRequest,
  type = 'default',
  identifier?: string,
): Promise<boolean> {
  const { limit, windowSec } = getLimitConfig(type)
  const key = buildRateLimitKey(req, type, identifier)

  return (
    (await upstashLimit(key, limit, windowSec)) ?? memoryLimit(key, limit, windowSec * 1000)
  )
}

export async function rateLimit(
  req: NextRequest,
  type = 'default',
  identifier?: string,
): Promise<NextResponse | null> {
  const limited = await isRateLimited(req, type, identifier)
  if (!limited) return null
  return createRateLimitResponse(type)
}
