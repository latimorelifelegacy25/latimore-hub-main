export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/ai/shared'
import { getGbpOAuthStateCookieName, exchangeGbpCode } from '@/lib/gbp/oauth'
import {
  fetchGoogleUserInfo,
  upsertGoogleCalendarConnection,
} from '@/lib/calendar/google'

export async function GET(req: NextRequest) {
  const auth = await requireAdminSession()
  if (!auth.ok) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const expectedState = req.cookies.get(getGbpOAuthStateCookieName())?.value

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL('/admin/settings?error=gbp_state_mismatch', req.url))
  }

  try {
    // Exchange with the GBP redirect URI (/api/gbp/callback) — the same URI
    // used in the authorization request. The Calendar token exchange sends a
    // different redirect URI and Google rejects the mismatch, so GBP uses its
    // own exchange. Incremental auth (include_granted_scopes) adds
    // business.manage to the same refresh token, which is stored in the
    // shared Google token row.
    const tokenData = await exchangeGbpCode(code)
    const user = await fetchGoogleUserInfo(tokenData.access_token)

    const ownerEmail = (process.env.GOOGLE_CALENDAR_OWNER_EMAIL ?? '').trim().toLowerCase()
    const accountEmail = (user.email ?? '').trim().toLowerCase()

    if (ownerEmail && accountEmail && ownerEmail !== accountEmail) {
      return NextResponse.redirect(new URL('/admin/settings?error=gbp_wrong_account', req.url))
    }

    await upsertGoogleCalendarConnection({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token ?? null,
      expiresIn: tokenData.expires_in ?? null,
      accountEmail: accountEmail || null,
      externalId: user.id ?? null,
    })

    const res = NextResponse.redirect(new URL('/admin/settings?gbp_connected=1', req.url))
    res.cookies.set(getGbpOAuthStateCookieName(), '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })
    return res
  } catch {
    return NextResponse.redirect(new URL('/admin/settings?error=gbp_connect_failed', req.url))
  }
}
