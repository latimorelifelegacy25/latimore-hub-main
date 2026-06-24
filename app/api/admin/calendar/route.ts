/**
 * GET  /api/admin/calendar  — Check Google Calendar connection status
 * POST /api/admin/calendar  — Initiate OAuth reconnect flow
 * PUT  /api/admin/calendar  — Force token refresh attempt
 */
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import {
  buildGoogleCalendarAuthUrl,
  getGoogleCalendarConnection,
  refreshGoogleAccessToken,
} from '@/lib/calendar/google'
import crypto from 'crypto'

// ── GET — connection status ──────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const connection = await getGoogleCalendarConnection()

  if (!connection) {
    return NextResponse.json({ connected: false, reason: 'No calendar connection found.' })
  }

  const now = Date.now()
  const expiresAt = connection.tokenExpiresAt?.getTime() ?? 0
  const expired = expiresAt < now

  return NextResponse.json({
    connected: true,
    accountEmail: connection.accountEmail ?? null,
    tokenExpired: expired,
    tokenExpiresAt: connection.tokenExpiresAt?.toISOString() ?? null,
    hasRefreshToken: !!connection.refreshToken,
    updatedAt: connection.updatedAt.toISOString(),
  })
}

// ── POST — initiate OAuth reconnect ─────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const state = crypto.randomBytes(16).toString('hex')
    const authUrl = buildGoogleCalendarAuthUrl(state)
    return NextResponse.json({ ok: true, authUrl })
  } catch (err: any) {
    logger.error({ err: err.message }, 'calendar-admin: build auth url failed')
    return NextResponse.json(
      { ok: false, error: err.message ?? 'Failed to build OAuth URL' },
      { status: 500 }
    )
  }
}

// ── PUT — force token refresh ────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const connection = await getGoogleCalendarConnection()
  if (!connection) {
    return NextResponse.json({ ok: false, error: 'No calendar connection found.' }, { status: 404 })
  }
  if (!connection.refreshToken) {
    return NextResponse.json({ ok: false, error: 'No refresh token stored. Full reconnect required.' }, { status: 422 })
  }

  try {
    const refreshed = await refreshGoogleAccessToken(connection.refreshToken)
    const tokenExpiresAt = refreshed.expires_in
      ? new Date(Date.now() + refreshed.expires_in * 1000)
      : null

    await prisma.calendarConnection.update({
      where: { id: connection.id },
      data: { accessToken: refreshed.access_token, tokenExpiresAt },
    })

    logger.info({ accountEmail: connection.accountEmail }, 'calendar-admin: token manually refreshed')
    return NextResponse.json({
      ok: true,
      tokenExpiresAt: tokenExpiresAt?.toISOString() ?? null,
    })
  } catch (err: any) {
    logger.error({ err: err.message }, 'calendar-admin: token refresh failed')
    return NextResponse.json(
      { ok: false, error: err.message ?? 'Token refresh failed. Full reconnect may be required.' },
      { status: 500 }
    )
  }
}
