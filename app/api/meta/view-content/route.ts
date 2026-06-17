import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'

export const dynamic = 'force-dynamic'

type ViewContentBody = {
  eventId?: string
  eventSourceUrl?: string
  contentName?: string
  contentCategory?: string
}

function cleanString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as ViewContentBody | null

    if (!body) {
      return NextResponse.json({ ok: false, error: 'Malformed or missing JSON body' }, { status: 400 })
    }

    const eventId = cleanString(body.eventId)
    const eventSourceUrl = cleanString(body.eventSourceUrl)
    const contentName = cleanString(body.contentName, 'Latimore Life & Legacy')
    const contentCategory = cleanString(body.contentCategory, 'Insurance Education')

    if (!eventId) {
      return NextResponse.json({ ok: false, error: 'Missing eventId for Meta deduplication' }, { status: 400 })
    }

    if (!eventSourceUrl) {
      return NextResponse.json({ ok: false, error: 'Missing eventSourceUrl' }, { status: 400 })
    }

    const pixelId = process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID || '988841003848131'
    const accessToken = process.env.META_CAPI_ACCESS_TOKEN

    if (!pixelId || !accessToken) {
      return NextResponse.json(
        { ok: false, error: 'Missing META_PIXEL_ID or META_CAPI_ACCESS_TOKEN' },
        { status: 500 }
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
      `https://graph.facebook.com/v20.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store',
      }
    )

    const result = await response.json().catch(() => null)

    return NextResponse.json({
      ok: response.ok,
      meta: result,
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'Meta ViewContent CAPI event failed' }, { status: 500 })
  }
}
