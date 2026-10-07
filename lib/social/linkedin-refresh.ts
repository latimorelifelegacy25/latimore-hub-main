/**
 * LinkedIn OAuth token refresh + connection health check.
 *
 * LinkedIn access tokens expire (developer-console tokens can die within
 * hours). When a refresh token is stored on the SocialConnection row, we
 * can mint a fresh access token without the user pasting a new one.
 *
 * Requires LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET env vars (from the
 * LinkedIn developer app). Without them, refresh is unavailable and the
 * caller must surface a manual re-auth prompt.
 */

const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken'

export type LinkedInRefreshResult = {
  accessToken: string
  refreshToken: string
  expiresIn: number // seconds
}

/**
 * Exchange a LinkedIn refresh token for a new access token.
 * Throws if no OAuth app credentials are configured or the refresh fails.
 */
export async function refreshLinkedInAccessToken(
  refreshToken: string,
): Promise<LinkedInRefreshResult> {
  const clientId = process.env.LINKEDIN_CLIENT_ID
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error(
      'LinkedIn OAuth app not configured (LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET missing). Manual token re-auth required.',
    )
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  })

  const res = await fetch(LINKEDIN_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  const raw = await res.text()
  if (!res.ok) {
    throw new Error(`LinkedIn token refresh failed with HTTP ${res.status}: ${raw}`)
  }

  let json: Record<string, unknown> = {}
  try {
    json = JSON.parse(raw)
  } catch {
    throw new Error('LinkedIn token refresh returned invalid JSON')
  }

  const accessToken = json.access_token
  if (typeof accessToken !== 'string' || !accessToken) {
    throw new Error('LinkedIn token refresh response missing access_token')
  }

  // LinkedIn may rotate the refresh token; keep the old one if not rotated.
  const newRefreshToken =
    typeof json.refresh_token === 'string' && json.refresh_token
      ? json.refresh_token
      : refreshToken

  const expiresIn = typeof json.expires_in === 'number' ? json.expires_in : 3600

  return { accessToken, refreshToken: newRefreshToken, expiresIn }
}

/**
 * Validate a LinkedIn access token by hitting the userinfo endpoint.
 * Returns true if the token is live, false if expired/invalid.
 */
export async function isLinkedInTokenValid(accessToken: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    return res.ok
  } catch {
    return false
  }
}
