export const dynamic = 'force-dynamic'

import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/ai/shared'
import { buildGoogleCalendarAuthUrl, getGoogleCalendarRedirectUri } from '@/lib/calendar/google'

export async function GET(req: NextRequest) {
  // Google returns to the redirect URI's host. The OAuth state cookie and the
  // admin session are per-host, so start the flow on that same host or the
  // callback can't see either one.
  const callbackOrigin = new URL(getGoogleCalendarRedirectUri()).origin
  const requestHost = (req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? '').toLowerCase()
  if (requestHost && new URL(callbackOrigin).host.toLowerCase() !== requestHost) {
    return NextResponse.redirect(`${callbackOrigin}/api/calendar/google/connect`)
  }

  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  const state = crypto.randomBytes(24).toString('hex')
  const url = buildGoogleCalendarAuthUrl(state)

  const res = NextResponse.redirect(url)
  res.cookies.set('google_calendar_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10,
  })

  return res
}