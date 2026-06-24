export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { POST as runDailyBrief } from '@/app/api/ai/daily-brief/route'
import { requireCronAuth } from '@/lib/ai/shared'

export async function GET(req: NextRequest) {
  const unauthorized = requireCronAuth(req)
  if (unauthorized) return unauthorized

  const headers = new Headers(req.headers)
  headers.set('content-type', 'application/json')

  const cronPostRequest = new Request(req.url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ limit: 10 }),
  })

  return runDailyBrief(cronPostRequest as NextRequest)
}
