export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireCronAuth } from '@/lib/ai/shared'
import { syncGoogleAppointmentEvents } from '@/lib/calendar/sync-google-appointments'
import { captureException } from '@/lib/error-tracking'

function numberParam(req: NextRequest, key: string, fallback: number) {
  const value = req.nextUrl.searchParams.get(key)
  if (!value) return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

async function handle(req: NextRequest) {
  const authError = requireCronAuth(req)
  if (authError) return authError

  const pastDays = Math.min(Math.max(numberParam(req, 'pastDays', 14), 0), 90)
  const futureDays = Math.min(Math.max(numberParam(req, 'futureDays', 90), 1), 365)
  const maxResults = Math.min(Math.max(numberParam(req, 'maxResults', 100), 1), 250)
  const now = new Date()

  try {
    const result = await syncGoogleAppointmentEvents({
      timeMin: new Date(now.getTime() - pastDays * 24 * 60 * 60 * 1000),
      timeMax: new Date(now.getTime() + futureDays * 24 * 60 * 60 * 1000),
      maxResults,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    await captureException(error, { source: 'google-appointments-sync' })
    return NextResponse.json(
      { ok: false, error: error?.message ?? 'Google appointment sync failed' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  return handle(req)
}

export async function POST(req: NextRequest) {
  return handle(req)
}
