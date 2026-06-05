// lib/reporting/dates.ts
export function getNow() {
  return Date.now()
}

export function getThirtyDaysAgo(now = getNow()) {
  return new Date(now - 30 * 24 * 60 * 60 * 1000)
}

export function getSevenDaysAgo(now = getNow()) {
  return new Date(now - 7 * 24 * 60 * 60 * 1000)
}

