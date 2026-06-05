// lib/reporting/events.ts
import { getRecentEvents } from '@/lib/hub/reporting'

export async function getRecentEventFeed(limit = 100) {
  const items = await getRecentEvents(limit)
  return {
    items,
    count: items.length
  }
}
