import { getRecentEvents } from '@/lib/hub/reporting'
import { cached } from './cache'

export async function getCrmEvents(limit = 100) {
  return cached(`crm-events-${limit}`, 30_000, async () => {
    const items = await getRecentEvents(limit)
    return { items, count: items.length }
  })
}
