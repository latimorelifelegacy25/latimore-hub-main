import { BOOKING_CONFIG } from '@/lib/booking/config'
import { getValidGoogleAccessToken } from '@/lib/calendar/google'
import { recordAppointment } from '@/lib/hub/record-appointment'
import { logger } from '@/lib/logger'

type GoogleCalendarEvent = {
  id?: string
  status?: string
  summary?: string
  description?: string
  htmlLink?: string
  hangoutLink?: string
  location?: string
  start?: { dateTime?: string; date?: string; timeZone?: string }
  end?: { dateTime?: string; date?: string; timeZone?: string }
  attendees?: Array<{ email?: string; displayName?: string; self?: boolean; responseStatus?: string }>
  organizer?: { email?: string; displayName?: string; self?: boolean }
  creator?: { email?: string; displayName?: string; self?: boolean }
  conferenceData?: {
    entryPoints?: Array<{ entryPointType?: string; uri?: string; label?: string }>
  }
}

type SyncGoogleAppointmentEventsInput = {
  timeMin?: Date
  timeMax?: Date
  maxResults?: number
}

function stripHtml(value?: string | null) {
  return String(value ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function linesFrom(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function extractEmail(text: string) {
  return text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]?.toLowerCase() ?? null
}

function extractPhoneNearBookedBy(text: string) {
  const lines = linesFrom(text)
  const bookedByIndex = lines.findIndex((line) => /^booked by$/i.test(line))
  const candidateLines = bookedByIndex >= 0 ? lines.slice(bookedByIndex + 1, bookedByIndex + 8) : lines.slice(0, 8)
  for (const line of candidateLines) {
    if (/@/.test(line)) continue
    const match = line.match(/(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/)
    if (match) return match[0]
  }
  return null
}

function extractBookedByName(summary: string, descriptionText: string, attendeeName?: string | null) {
  const parenMatch = summary.match(/\(([^)]+)\)\s*$/)
  if (parenMatch?.[1]) return parenMatch[1].trim()

  const lines = linesFrom(descriptionText)
  const bookedByIndex = lines.findIndex((line) => /^booked by$/i.test(line))
  if (bookedByIndex >= 0) {
    const candidate = lines
      .slice(bookedByIndex + 1, bookedByIndex + 5)
      .find((line) => !/@/.test(line) && !/\d{3}[\s.-]?\d{3}[\s.-]?\d{4}/.test(line))
    if (candidate) return candidate
  }

  return attendeeName?.trim() || null
}

function splitFullName(fullName?: string | null) {
  const parts = String(fullName ?? '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return { firstName: null, lastName: null }
  if (parts.length === 1) return { firstName: parts[0], lastName: null }
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts.at(-1) ?? null }
}

function shouldImportEvent(event: GoogleCalendarEvent) {
  if (!event.id || event.status === 'cancelled') return false
  const haystack = `${event.summary ?? ''}\n${event.description ?? ''}`.toLowerCase()
  return haystack.includes('book with jackson') || haystack.includes('booked by')
}

function getMeetingUrl(event: GoogleCalendarEvent) {
  return (
    event.hangoutLink ??
    event.conferenceData?.entryPoints?.find((entry) => entry.entryPointType === 'video')?.uri ??
    event.htmlLink ??
    null
  )
}

function extractContact(event: GoogleCalendarEvent) {
  const summary = event.summary ?? ''
  const descriptionText = stripHtml(event.description)
  const attendee = event.attendees?.find((item) => item.email && !item.self && item.responseStatus !== 'declined')
  const email = attendee?.email?.toLowerCase() ?? extractEmail(descriptionText)
  const fullName = extractBookedByName(summary, descriptionText, attendee?.displayName)
  const { firstName, lastName } = splitFullName(fullName)
  const phone = extractPhoneNearBookedBy(descriptionText)

  return { email, phone, fullName, firstName, lastName, descriptionText }
}

export async function syncGoogleAppointmentEvents(input: SyncGoogleAppointmentEventsInput = {}) {
  const now = new Date()
  const timeMin = input.timeMin ?? new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const timeMax = input.timeMax ?? new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
  const maxResults = Math.min(Math.max(input.maxResults ?? 100, 1), 250)
  const accessToken = await getValidGoogleAccessToken()

  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: String(maxResults),
  })

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(BOOKING_CONFIG.calendarId)}/events?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    }
  )

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error?.message || 'Failed to fetch Google Calendar events')
  }

  const events = Array.isArray(data.items) ? (data.items as GoogleCalendarEvent[]) : []
  let imported = 0
  let updated = 0
  let skipped = 0
  const errors: Array<{ eventId?: string; title?: string; error: string }> = []

  for (const event of events) {
    if (!shouldImportEvent(event)) {
      skipped += 1
      continue
    }

    const startAt = event.start?.dateTime
    if (!startAt) {
      skipped += 1
      continue
    }

    const contact = extractContact(event)
    if (!contact.email && !contact.phone) {
      skipped += 1
      errors.push({ eventId: event.id, title: event.summary, error: 'Missing attendee email/phone' })
      continue
    }

    try {
      const result = await recordAppointment({
        gcalId: event.id ?? null,
        scheduledFor: startAt,
        endAt: event.end?.dateTime ?? null,
        bookingSource: 'google_calendar_sync',
        source: 'google_calendar',
        medium: 'appointment_scheduling',
        campaign: 'google_appointment_schedule',
        location: getMeetingUrl(event) ?? event.location ?? null,
        meetingUrl: getMeetingUrl(event),
        timezone: event.start?.timeZone ?? BOOKING_CONFIG.timezone,
        title: event.summary ?? 'Book With Jackson',
        description: contact.descriptionText,
        firstName: contact.firstName,
        lastName: contact.lastName,
        fullName: contact.fullName,
        email: contact.email,
        phone: contact.phone,
        landingPage: '/book',
        notes: contact.descriptionText,
        rawPayload: {
          htmlLink: event.htmlLink ?? null,
          organizer: event.organizer ?? null,
          creator: event.creator ?? null,
        },
      })

      if (result.createdAppointment) imported += 1
      else updated += 1
    } catch (error: any) {
      logger.error({ error: error?.message, eventId: event.id }, 'google appointment sync failed for event')
      errors.push({ eventId: event.id, title: event.summary, error: error?.message ?? 'Unknown error' })
    }
  }

  return {
    ok: errors.length === 0,
    scanned: events.length,
    imported,
    updated,
    skipped,
    errors,
    window: {
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
    },
  }
}
