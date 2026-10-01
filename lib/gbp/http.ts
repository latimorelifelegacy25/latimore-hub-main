/**
 * Google Business Profile API — pure HTTP layer.
 *
 * Publishing uses the Google My Business v4 endpoint:
 *   POST https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}/localPosts
 * with the https://www.googleapis.com/auth/business.manage OAuth scope.
 *
 * IMPORTANT — Google approval gate: local-post writes require the Cloud
 * project's "Application for Basic API Access" to be approved by Google.
 * Until approval lands the API returns 403 (quota is 0). This module surfaces
 * that as GbpNotApprovedError with a clear message instead of failing silently.
 * Nothing is ever published as a connectivity test — posts go live immediately.
 *
 * This file is deliberately free of app imports (no @/ aliases, no Node-only
 * APIs beyond the global fetch). It is the single source of truth for the GBP
 * HTTP calls, shared by the Next.js app (via lib/gbp/client.ts, which supplies
 * the OAuth access token from the server-side token store) and the agent
 * harness (via latimore-os/agent-harness/src/lib/gbp-client.ts, which
 * re-exports it through a relative path so the harness's standalone
 * TypeScript build can resolve it). Keep it import-free.
 */

const GBP_API_BASE = 'https://mybusiness.googleapis.com/v4'

export class GbpNotConnectedError extends Error {
  constructor(message = 'Google Business Profile is not connected.') {
    super(message)
    this.name = 'GbpNotConnectedError'
  }
}

export class GbpNotApprovedError extends Error {
  constructor(message = 'Google has not approved this project for the Business Profile API yet.') {
    super(message)
    this.name = 'GbpNotApprovedError'
  }
}

export class GbpError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'GbpError'
    this.status = status
  }
}

export interface GbpCallToAction {
  actionType: 'BOOK' | 'ORDER' | 'SHOP' | 'LEARN_MORE' | 'SIGN_UP' | 'CALL'
  url?: string
}

export interface CreateLocalPostInput {
  /** Location resource name, e.g. "accounts/123456789/locations/987654321" */
  locationName: string
  /** Post body — GBP truncates long summaries, keep it tight (150-300 chars ideal). */
  summary: string
  languageCode?: string
  topicType?: 'STANDARD' | 'EVENT' | 'OFFER' | 'ALERT'
  callToAction?: GbpCallToAction
  /** Publicly reachable image URL for the post media. */
  mediaUrl?: string
}

export interface GbpLocalPost {
  name?: string
  languageCode?: string
  summary?: string
  state?: string
  searchUrl?: string
  createTime?: string
  [key: string]: unknown
}

function looksLikeApprovalGate(status: number, message: string): boolean {
  if (status !== 403) return false
  return /not been used|has not been used|disabled|accessnotconfigured|access_not_configured|permission_denied|does not have permission|quota/i.test(
    message,
  )
}

async function gbpFetch<T>(accessToken: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${GBP_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })

  const data = (await res.json().catch(() => null)) as {
    error?: { code?: number; message?: string; status?: string }
  } | null

  if (!res.ok) {
    const message = data?.error?.message || `GBP API request failed (HTTP ${res.status})`
    if (looksLikeApprovalGate(res.status, message)) {
      throw new GbpNotApprovedError(
        'Google has not approved API access for this project yet (quota is 0 until the "Application for Basic API Access" is approved). ' +
          `Google said: ${message}`,
      )
    }
    if (res.status === 401) {
      throw new GbpNotConnectedError(`Google rejected the access token: ${message}`)
    }
    throw new GbpError(message, res.status)
  }

  return data as T
}

export async function createLocalPost(
  input: CreateLocalPostInput,
  accessToken: string,
): Promise<GbpLocalPost> {
  const locationName = input.locationName.trim()
  if (!/^accounts\/[^/]+\/locations\/[^/]+$/.test(locationName)) {
    throw new GbpError(
      `Invalid GBP location name "${locationName}". Expected format: accounts/{accountId}/locations/{locationId}`,
      400,
    )
  }

  const summary = input.summary.trim()
  if (!summary) throw new GbpError('Cannot publish an empty GBP post.', 400)

  const body: Record<string, unknown> = {
    languageCode: input.languageCode || 'en-US',
    summary,
    topicType: input.topicType || 'STANDARD',
  }

  if (input.callToAction) {
    const cta: Record<string, unknown> = { actionType: input.callToAction.actionType }
    if (input.callToAction.url) cta.url = input.callToAction.url
    body.callToAction = cta
  }

  if (input.mediaUrl) {
    // sourceUrl is the only supported data field for a LocalPost MediaItem.
    body.media = [{ mediaFormat: 'PHOTO', sourceUrl: input.mediaUrl }]
  }

  return gbpFetch<GbpLocalPost>(
    accessToken,
    `/${locationName}/localPosts`,
    { method: 'POST', body: JSON.stringify(body) },
  )
}

export interface GbpAccount {
  name?: string
  accountName?: string
  [key: string]: unknown
}

export interface GbpLocation {
  name?: string
  title?: string
  [key: string]: unknown
}

/** Lists the GBP accounts the connected Google user manages. */
export async function listGbpAccounts(accessToken: string): Promise<GbpAccount[]> {
  const data = await gbpFetch<{ accounts?: GbpAccount[] }>(accessToken, '/accounts?pageSize=50')
  return data.accounts || []
}

/** Lists locations for one account. Pass the account `name` from listGbpAccounts(). */
export async function listGbpLocations(
  accessToken: string,
  accountName: string,
): Promise<GbpLocation[]> {
  const data = await gbpFetch<{ locations?: GbpLocation[] }>(
    accessToken,
    `/${accountName}/locations?pageSize=50&readMask=name,title`,
  )
  return data.locations || []
}
