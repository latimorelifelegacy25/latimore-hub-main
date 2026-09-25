import { prisma } from '@/lib/prisma'
import { BOOKING_CONFIG } from '@/lib/booking/config'
import {
  addDays,
  addMinutes,
  addHours,
  format,
  getDay,
  isBefore,
  parseISO,
  startOfDay,
} from 'date-fns'
import { fromZonedTime, toZonedTime } from 'date-fns-tz'
import { fetchGoogleFreeBusy } from '@/lib/calendar/availability'

type Interval = {
  start: Date
  end: Date
}

function overlaps(a: Interval, b: Interval) {
  return a.start < b.end && b.start < a.end
}

function buildDayWindow(day: Date) {
  const yyyyMmDd = format(day, 'yyyy-MM-dd')
  const startLocal = `${yyyyMmDd}T${String(BOOKING_CONFIG.startHour).padStart(2, '0')}:00:00`
  const endLocal = `${yyyyMmDd}T${String(BOOKING_CONFIG.endHour).padStart(2, '0')}:00:00`

  return {
    startUtc: fromZonedTime(startLocal, BOOKING_CONFIG.timezone),
    endUtc: fromZonedTime(endLocal, BOOKING_CONFIG.timezone),
  }
}

function buildCandidateSlotsForDay(day: Date) {
  const { startUtc, endUtc } = buildDayWindow(day)
  const slots: Date[] = []

  let cursor = startUtc
  while (addMinutes(cursor, BOOKING_CONFIG.durationMinutes) <= endUtc) {
    slots.push(cursor)
    cursor = addMinutes(cursor, BOOKING_CONFIG.durationMinutes + BOOKING_CONFIG.bufferMinutes)
  }

  return slots
}

export async function generateAvailability(input?: {
  from?: Date
  days?: number
}) {
  const now = new Date()
  const from = input?.from ?? now
  const horizonDays = input?.days ?? BOOKING_CONFIG.horizonDays
  const minBookTime = addHours(now, BOOKING_CONFIG.minimumNoticeHours)

  const daysToCheck = Array.from({ length: horizonDays }, (_, i) => addDays(startOfDay(from), i))

  const appointmentWindowStart = buildDayWindow(daysToCheck[0]).startUtc.toISOString()
  const appointmentWindowEnd = buildDayWindow(daysToCheck[daysToCheck.length - 1]).endUtc.toISOString()

  const upcomingAppointments = await prisma.appointment.findMany({
    where: {
      scheduledFor: {
        gte: new Date(appointmentWindowStart),
        lte: new Date(appointmentWindowEnd),
      },
      status: { in: ['Booked', 'Confirmed'] },
    },
    select: {
      scheduledFor: true,
    },
  })

  const dailyCounts = new Map<string, number>()
  for (const appt of upcomingAppointments) {
    if (!appt.scheduledFor) continue
    const local = toZonedTime(appt.scheduledFor, BOOKING_CONFIG.timezone)
    const key = format(local, 'yyyy-MM-dd')
    dailyCounts.set(key, (dailyCounts.get(key) ?? 0) + 1)
  }

  return {
    now,
    minBookTime,
    daysToCheck,
    dailyCounts,
  }
}

export function projectSlots(input: {
  daysToCheck: Date[]
  busy: { start: string; end: string }[]
  minBookTime: Date
  dailyCounts: Map<string, number>
}) {
  const busyIntervals: Interval[] = input.busy.map((b) => ({
    start: parseISO(b.start),
    end: parseISO(b.end),
  }))

  const results: {
    date: string
    slots: string[]
  }[] = []

  for (const day of input.daysToCheck) {
    const localDay = toZonedTime(day, BOOKING_CONFIG.timezone)
    const weekday = getDay(localDay)

    if (!BOOKING_CONFIG.workingDays.includes(weekday)) continue

    const dayKey = format(localDay, 'yyyy-MM-dd')
    const alreadyBooked = input.dailyCounts.get(dayKey) ?? 0

    if (alreadyBooked >= BOOKING_CONFIG.maxBookingsPerDay) {
      results.push({ date: dayKey, slots: [] })
      continue
    }

    const candidates = buildCandidateSlotsForDay(localDay)

    const availableSlots = candidates.filter((slotStart) => {
      const slotEnd = addMinutes(slotStart, BOOKING_CONFIG.durationMinutes)
      const slotWithBuffer: Interval = {
        start: addMinutes(slotStart, -BOOKING_CONFIG.bufferMinutes),
        end: addMinutes(slotEnd, BOOKING_CONFIG.bufferMinutes),
      }

      if (isBefore(slotStart, input.minBookTime)) return false

      const isBusy = busyIntervals.some((busy) => overlaps(slotWithBuffer, busy))
      if (isBusy) return false

      return true
    })

    results.push({
      date: dayKey,
      slots: availableSlots.map((slot) => slot.toISOString()),
    })
  }

  return results
}

/**
 * The bookable slots currently offered to visitors: working hours, minimum
 * notice, daily cap, and Google Calendar busy time all applied. Used both to
 * render availability and to re-validate a requested slot at booking time.
 */
export async function loadOfferedAvailability() {
  const base = await generateAvailability()

  const firstDay = base.daysToCheck[0]
  const lastDay = base.daysToCheck[base.daysToCheck.length - 1]

  const busy = await fetchGoogleFreeBusy({
    timeMin: new Date(firstDay.getTime()).toISOString(),
    timeMax: new Date(lastDay.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    calendarId: BOOKING_CONFIG.calendarId,
  })

  return projectSlots({
    daysToCheck: base.daysToCheck,
    busy,
    minBookTime: base.minBookTime,
    dailyCounts: base.dailyCounts,
  })
}
