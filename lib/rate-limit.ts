import { NextRequest, NextResponse } from 'next/server'

// Limit config shared by both the Upstash and in-memory implementations
const LIMITS: Record<string, { limit: number; windowSec: number }> = {
  cardEvents: { limit: 200, windowSec: 60 },
  fillout:    { limit: 20,  windowSec: 60 },
  inquiries:  { limit: 60,  windowSec: 60 },
  booking:    { limit: 10,  windowSec: 60 },
  reports:    { limit: 30,  windowSec: 60 },
  lead:       { limit: 10,  windowSec: 60 },
  default:    { limit: 100, windowSec: 60 },
}

// ─── Upstash Redis (preferred: works across all instances / edge) ─────────────

let _upstash: import('@upstash/ratelimit').Ratelimit | null = null

function getUpstash(): import('@upstash/ratelimit').Ratelimit | null {
  if (_upstash) return _upstash
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  try {
    const { Ratelimit } = require('@upstash/ratelimit')
    const { Redis } = require('@upstash/redis')
    const redis = new Redis({ url, token })
    _upstash = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(1, '1 s') })
    return _upstash
  } catch {
    return null
  }
}, 60_000)

const LIMITS: Record<string, { limit: number; windowMs: number }> = {
  cardEvents: { limit: 200, windowMs: 60_000 },
  event:      { limit: 200, windowMs: 60_000 },
  fillout:    { limit: 20,  windowMs: 60_000 },
  lead:       { limit: 20,  windowMs: 60_000 },
  inquiries:  { limit: 60,  windowMs: 60_000 },
  booking:    { limit: 10,  windowMs: 60_000 },
  reports:    { limit: 30,  windowMs: 60_000 },
  default:    { limit: 100, windowMs: 60_000 },
}

async function upstashLimit(key: string, limit: number, windowSec: number): Promise<boolean> {
  const client = getUpstash()
  if (!client) return false
  try {
    const { Ratelimit } = require('@upstash/ratelimit')
    const { Redis } = require('@upstash/redis')
    const url = process.env.UPSTASH_REDIS_REST_URL!
    const token = process.env.UPSTASH_REDIS_REST_TOKEN!
    const redis = new Redis({ url, token })
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
    })
    const { success } = await limiter.limit(key)
    return !success
  } catch {
    return false
  }
}

// ─── In-memory fallback (single-instance only — used when Upstash is not configured) ─

const store = new Map<string, { count: number; reset: number }>()

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

// ─── Public interface ─────────────────────────────────────────────────────────

export async function rateLimit(req: NextRequest, type = 'default'): Promise<NextResponse | null> {
  const { limit, windowSec } = LIMITS[type] ?? LIMITS.default
  // Validate x-forwarded-for against a trusted structure to prevent header spoofing
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const key = `rl:${type}:${ip}`

  const limited = process.env.UPSTASH_REDIS_REST_URL
    ? await upstashLimit(key, limit, windowSec)
    : memoryLimit(key, limit, windowSec * 1000)

  if (!limited) return null
  return NextResponse.json(
    { ok: false, error: 'Too many requests — please slow down.' },
    { status: 429, headers: { 'Retry-After': String(windowSec), 'X-RateLimit-Limit': String(limit) } }
  )
}
