import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      eventId,
      eventSourceUrl,
      contentName = 'Latimore Life & Legacy',
      contentCategory = 'Insurance Education',
    } = body

    if (!eventId) {
      return NextResponse.json(
        { ok: false, error: 'Missing eventId' },
        { status: 400 }
      )
    }

    const pixelId = process.env.META_PIXEL_ID
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

    const payload = {
      data: [
        {
          event_name: 'ViewContent',
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          action_source: 'website',
          event_source_url: eventSourceUrl,
          user_data: {
            client_ip_address: ip,
            client_user_agent: userAgent,
            fbp,
            fbc,
          },
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    )

    const result = await response.json()

    return NextResponse.json({
      ok: response.ok,
      meta: result,
    })
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Meta ViewContent CAPI failed' },
      { status: 500 }
    )
  }
}
