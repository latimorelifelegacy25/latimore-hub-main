import { BOOKING_CONFIG } from '@/lib/booking/config'
import { fetchGoogleCalendarApi } from '@/lib/calendar/authenticated-fetch'

type BusyInterval = {
  start: string
  end: string
}

export async function fetchGoogleFreeBusy(input: {
  timeMin: string
  timeMax: string
  calendarId?: string
}) {
  const calendarId = input.calendarId || BOOKING_CONFIG.calendarId

  const res = await fetchGoogleCalendarApi('https://www.googleapis.com/calendar/v3/freeBusy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      timeMin: input.timeMin,
      timeMax: input.timeMax,
      timeZone: BOOKING_CONFIG.timezone,
      items: [{ id: calendarId }],
    }),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data?.error?.message || 'Failed to fetch Google Calendar free/busy')
  }

  const busy = (data?.calendars?.[calendarId]?.busy ?? []) as BusyInterval[]
  return busy
}
