import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'

// Limit config shared by both the Upstash and in-memory implementations.
const LIMITS: Record<string, { limit: number; windowSec: number }> = {
  analytics: { limit: 120, windowSec: 60 },
  booking: { limit: 10, windowSec: 60 },
  cardEvents: { limit: 200, windowSec: 60 },
  fillout: { limit: 20, windowSec: 60 },
  inquiries: { limit: 60, windowSec: 60 },
  reports: { limit: 30, windowSec: 60 },
  event: { limit: 120, windowSec: 60 },
  lead: { limit: 30, windowSec: 60 },
  join: { limit: 10, windowSec: 60 },
  ethos_redirect: { limit: 60, windowSec: 60 },
  default: { limit: 100, windowSec: 60 },
}

const upstashLimiters = new Map<string, Ratelimit>()

function hasUpstashConfig(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
}

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

function getUpstashLimiter(limit: number, windowSec: number): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null

  const key = `${limit}:${windowSec}`
  const cached = upstashLimiters.get(key)
  if (cached) return cached

  const redis = new Redis({ url, token })
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
  })
  upstashLimiters.set(key, limiter)
  return limiter
}

async function upstashLimit(key: string, limit: number, windowSec: number): Promise<boolean> {
  const limiter = getUpstashLimiter(limit, windowSec)
  if (!limiter) return isProduction()

  try {
    const { success } = await limiter.limit(key)
    return !success
  } catch {
    // In production, a rate-limit backend failure should not silently disable
    // protection on public intake/webhook routes. Local/dev keeps the old
    // permissive behavior to avoid blocking work when Redis is unavailable.
    return isProduction()
  }
}

// In-memory fallback (single-instance only — used outside production when Upstash is not configured).
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

export async function rateLimit(req: NextRequest, type = 'default'): Promise<NextResponse | null> {
  const { limit, windowSec } = LIMITS[type] ?? LIMITS.default
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const key = `rl:${type}:${ip}`

  const limited = hasUpstashConfig()
    ? await upstashLimit(key, limit, windowSec)
    : isProduction() || memoryLimit(key, limit, windowSec * 1000)

  if (!limited) return null
  return NextResponse.json(
    { ok: false, error: 'Too many requests — please slow down.' },
    { status: 429, headers: { 'Retry-After': String(windowSec), 'X-RateLimit-Limit': String(limit) } },
  )
}
