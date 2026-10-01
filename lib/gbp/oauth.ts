/**
 * Google Business Profile OAuth helpers.
 *
 * Reuses the same Google OAuth client (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET)
 * and the same encrypted token row (CalendarConnection, provider 'google') as the
 * Calendar integration. Connect via /api/gbp/connect using incremental auth
 * (include_granted_scopes=true), so an existing Calendar grant is preserved and
 * the business.manage scope is added to the same refresh token.
 */

const GBP_OAUTH_STATE_COOKIE = 'gbp_oauth_state'

export function getGbpOAuthStateCookieName(): string {
  return GBP_OAUTH_STATE_COOKIE
}

export function getGbpScopes(): string[] {
  return [
    'https://www.googleapis.com/auth/business.manage',
    'https://www.googleapis.com/auth/userinfo.email',
  ]
}

export function getGbpRedirectUri(): string {
  const configured = process.env.GBP_REDIRECT_URI?.trim()
  if (configured) return configured

  const baseUrl = (
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    ''
  ).replace(/\/$/, '')

  if (!baseUrl) {
    throw new Error('Missing GBP_REDIRECT_URI or NEXTAUTH_URL for GBP OAuth')
  }

  return `${baseUrl}/api/gbp/callback`
}

export function buildGbpAuthUrl(state: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) throw new Error('Missing required env var: GOOGLE_CLIENT_ID')
  const redirectUri = getGbpRedirectUri()

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    scope: getGbpScopes().join(' '),
    state,
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}
