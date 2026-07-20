import { prisma } from '@/lib/prisma'
import { decryptToken, encryptToken } from '@/lib/crypto'
import {
  getGoogleCalendarConnection,
  getValidGoogleAccessToken,
  refreshGoogleAccessToken,
} from '@/lib/calendar/google'

async function forceRefreshGoogleAccessToken() {
  const connection = await getGoogleCalendarConnection()
  if (!connection) throw new Error('Google Calendar is not connected')

  const refreshToken = decryptToken(connection.refreshToken)
  if (!refreshToken) throw new Error('Google Calendar refresh token is missing')

  const refreshed = await refreshGoogleAccessToken(refreshToken)
  const tokenExpiresAt =
    refreshed.expires_in && Number.isFinite(refreshed.expires_in)
      ? new Date(Date.now() + refreshed.expires_in * 1000)
      : null

  await prisma.calendarConnection.update({
    where: { id: connection.id },
    data: {
      accessToken: encryptToken(refreshed.access_token),
      tokenExpiresAt,
    },
  })

  return refreshed.access_token
}

function withBearerToken(init: RequestInit | undefined, accessToken: string): RequestInit {
  const headers = new Headers(init?.headers)
  headers.set('Authorization', `Bearer ${accessToken}`)

  return {
    ...init,
    headers,
    cache: 'no-store',
  }
}

/**
 * Calls a Google Calendar endpoint and retries once with a forced OAuth refresh
 * when Google rejects a token that the database still marks as unexpired.
 */
export async function fetchGoogleCalendarApi(url: string, init?: RequestInit) {
  const accessToken = await getValidGoogleAccessToken()
  let response = await fetch(url, withBearerToken(init, accessToken))

  if (response.status !== 401) return response

  const refreshedAccessToken = await forceRefreshGoogleAccessToken()
  response = await fetch(url, withBearerToken(init, refreshedAccessToken))
  return response
}
