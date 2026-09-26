import { NextRequest, NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { BRAND } from '@/lib/brand'
import { rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

type ViewContentBody = {
  eventId?: string
  eventSourceUrl?: string
  contentName?: string
  contentCategory?: string
}

function cleanString(value: unknown, fallback = '', maxLength = 200): string {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, maxLength) : fallback
}

// Only forward events for pages on this site, so the public endpoint can't be
// used to inject arbitrary URLs into the Meta pixel's event stream.
function isOwnSiteUrl(value: string, requestHost: string | null): boolean {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false
    const host = url.hostname.toLowerCase()
    const allowed = [new URL(BRAND.baseUrl).hostname, requestHost?.split(':')[0]]
      .filter((h): h is string => Boolean(h))
      .map(h => h.toLowerCase().replace(/^www\./, ''))
    const bare = host.replace(/^www\./, '')
    return allowed.some(h => bare === h || bare.endsWith(`.${h}`))
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, 'metaCapi')
  if (limited) return limited

  try {
    const body = (await req.json().catch(() => null)) as ViewContentBody | null

    if (!body) {
      return NextResponse.json({ ok: false, error: 'Malformed or missing JSON body' }, { status: 400 })
    }

    const eventId = cleanString(body.eventId, '', 100)
    const eventSourceUrl = cleanString(body.eventSourceUrl, '', 500)
    const contentName = cleanString(body.contentName, 'Latimore Life & Legacy')
    const contentCategory = cleanString(body.contentCategory, 'Insurance Education')

    if (!eventId) {
      return NextResponse.json({ ok: false, error: 'Missing eventId for Meta deduplication' }, { status: 400 })
    }

    if (!eventSourceUrl) {
      return NextResponse.json({ ok: false, error: 'Missing eventSourceUrl' }, { status: 400 })
    }

    if (!isOwnSiteUrl(eventSourceUrl, req.headers.get('host'))) {
      return NextResponse.json({ ok: false, error: 'eventSourceUrl must be on this site' }, { status: 400 })
    }

    const pixelId = process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID || '988841003848131'
    const accessToken = process.env.META_CAPI_ACCESS_TOKEN

    if (!pixelId || !accessToken) {
      return NextResponse.json(
        {
          ok: true,
          delivered: false,
          reason: 'Meta CAPI is not configured',
        },
        { status: 202 }
      )
    }

    const h = await headers()
    const c = await cookies()

    const ip =
      h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      h.get('x-real-ip') ||
      undefined

    const userAgent = h.get('user-agent') || undefined
    const fbp = c.get('_fbp')?.value
    const fbc = c.get('_fbc')?.value

    const userData: Record<string, string> = {}
    if (ip) userData.client_ip_address = ip
    if (userAgent) userData.client_user_agent = userAgent
    if (fbp) userData.fbp = fbp
    if (fbc) userData.fbc = fbc

    const payload = {
      data: [
        {
          event_name: 'ViewContent',
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          action_source: 'website',
          event_source_url: eventSourceUrl,
          user_data: userData,
          custom_data: {
            content_name: contentName,
            content_category: contentCategory,
          },
        },
      ],
    }

    const response = await fetch(
      `https://graph.facebook.com/v20.0/${pixelId}/events`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Token goes in the body so it never lands in request/proxy URL logs.
        body: JSON.stringify({ ...payload, access_token: accessToken }),
        cache: 'no-store',
      }
    )

    if (!response.ok) {
      const result = await response.json().catch(() => null)
      console.error('[meta-capi] ViewContent rejected', response.status, result)
    }

    // Don't echo Meta's raw response (error details, trace IDs) to the public.
    return NextResponse.json({ ok: response.ok, delivered: response.ok })
  } catch {
    return NextResponse.json({ ok: false, error: 'Meta ViewContent CAPI event failed' }, { status: 500 })
  }
}
