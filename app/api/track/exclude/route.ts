export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { INTERNAL_TRAFFIC_COOKIE, internalCookieDomain } from '@/lib/tracking/internal-traffic'

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

/**
 * Marks (or with ?off=1, unmarks) this browser as internal so its activity is
 * left out of visitor analytics. The cookie is scoped to the whole domain, so
 * signing into the hub also excludes the same browser on the public site.
 */
export async function GET(req: NextRequest) {
  const off = req.nextUrl.searchParams.get('off') === '1'
  const wantsJson = (req.headers.get('accept') || '').includes('application/json')
  const message = off
    ? 'This browser is counted in website analytics again.'
    : 'This browser is now excluded from website analytics. Your visits and clicks will not be counted.'

  const res = wantsJson
    ? NextResponse.json({ ok: true, excluded: !off })
    : new NextResponse(
        `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Analytics</title>` +
          `<body style="font-family:system-ui,sans-serif;background:#0E1A2B;color:#fff;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center;padding:1rem">` +
          `<div><p style="font-size:1.15rem">${message}</p><p><a style="color:#C9A25F" href="/">Back to site</a></p></div></body>`,
        { headers: { 'content-type': 'text/html; charset=utf-8' } },
      )

  res.headers.set('Cache-Control', 'no-store')
  res.cookies.set(INTERNAL_TRAFFIC_COOKIE, off ? '' : '1', {
    path: '/',
    maxAge: off ? 0 : ONE_YEAR_SECONDS,
    sameSite: 'lax',
    secure: req.nextUrl.protocol === 'https:',
    domain: internalCookieDomain(req.headers.get('host') || ''),
  })
  return res
}
