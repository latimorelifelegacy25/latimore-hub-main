import { NextRequest, NextResponse } from 'next/server'

const store = new Map<string, { count: number; reset: number }>()

const LIMITS: Record<string, { limit: number; windowMs: number }> = {
  cardEvents: { limit: 200, windowMs: 60_000 },
  fillout:   { limit: 20,  windowMs: 60_000 },
  inquiries: { limit: 60,  windowMs: 60_000 },
  booking:   { limit: 10,  windowMs: 60_000 },
  reports:   { limit: 30,  windowMs: 60_000 },
  default:   { limit: 100, windowMs: 60_000 },
}

export function rateLimit(req: NextRequest, type = 'default'): NextResponse | null {
  const { limit, windowMs } = LIMITS[type] ?? LIMITS.default
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const key = `${type}:${ip}`
  const now = Date.now()
  const rec = store.get(key)

  if (!rec || now > rec.reset) {
    store.set(key, { count: 1, reset: now + windowMs })
    return null
  }
  if (rec.count >= limit) {
    return NextResponse.json(
      { ok: false, error: 'Too many requests — please slow down.' },
      { status: 429, headers: { 'Retry-After': '60', 'X-RateLimit-Limit': String(limit) } }
    )
  }
  rec.count++
  return null
}
