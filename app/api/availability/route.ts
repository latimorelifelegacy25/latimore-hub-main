export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { BOOKING_CONFIG } from '@/lib/booking/config'
import { loadOfferedAvailability } from '@/lib/calendar/slots'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const days = await loadOfferedAvailability()

    return NextResponse.json({
      ok: true,
      timezone: BOOKING_CONFIG.timezone,
      rules: {
        workingDays: BOOKING_CONFIG.workingDays,
        startHour: BOOKING_CONFIG.startHour,
        endHour: BOOKING_CONFIG.endHour,
        durationMinutes: BOOKING_CONFIG.durationMinutes,
        bufferMinutes: BOOKING_CONFIG.bufferMinutes,
        minimumNoticeHours: BOOKING_CONFIG.minimumNoticeHours,
        horizonDays: BOOKING_CONFIG.horizonDays,
        maxBookingsPerDay: BOOKING_CONFIG.maxBookingsPerDay,
      },
      days,
    })
  } catch (error: any) {
    const message: string = error?.message ?? 'Failed to load availability'
    logger.error({ err: message }, 'availability: fetch failed')

    // Distinguish calendar connectivity/authentication issues from generic errors.
    const lowerMessage = message.toLowerCase()
    const isDisconnected =
      lowerMessage.includes('not connected') ||
      lowerMessage.includes('refresh token is missing') ||
      lowerMessage.includes('missing required env var: google_client') ||
      lowerMessage.includes('invalid_client') ||
      lowerMessage.includes('invalid_grant') ||
      lowerMessage.includes('token has been expired or revoked') ||
      lowerMessage.includes('unauthorized') ||
      lowerMessage.includes('authentication')

    return NextResponse.json(
      {
        ok: false,
        errorCode: isDisconnected ? 'CALENDAR_DISCONNECTED' : 'CALENDAR_ERROR',
        error: isDisconnected
          ? 'Calendar authorization needs to be refreshed.'
          : 'Available times could not be loaded.',
      },
      { status: 503 }
    )
  }
}
