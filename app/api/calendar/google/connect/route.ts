export const dynamic = 'force-dynamic'

import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { buildGoogleCalendarAuthUrl, getGoogleCalendarRedirectUri } from '@/lib/calendar/google'

function parseAdminEmails(v?: string | null): string[] {
  return (v ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

export async function GET(req: NextRequest) {
  // Google returns to the redirect URI's host. The OAuth state cookie and the
  // admin session are per-host, so start the flow on that same host or the
  // callback can't see either one.
  const callbackOrigin = new URL(getGoogleCalendarRedirectUri()).origin
  const requestHost = (req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? '').toLowerCase()
  if (requestHost && new URL(callbackOrigin).host.toLowerCase() !== requestHost) {
    return NextResponse.redirect(`${callbackOrigin}/api/calendar/google/connect`)
  }

  const session = await getServerSession(authOptions)
  const email = (session?.user?.email ?? '').toLowerCase()
  const allowed = parseAdminEmails(process.env.ADMIN_EMAILS)

  if (!email || (allowed.length > 0 && !allowed.includes(email))) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

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