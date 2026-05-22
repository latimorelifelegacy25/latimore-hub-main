export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { POST as runDailyBrief } from '@/app/api/ai/daily-brief/route'

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const headerSecret =
    req.headers.get('x-cron-secret') ?? req.headers.get('authorization')?.replace('Bearer ', '')

  if (!cronSecret || headerSecret !== cronSecret) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const request = new Request(req.url, {
    method: 'POST',
    headers: req.headers,
    body: JSON.stringify({ limit: 10 }),
  })

  return runDailyBrief(request as NextRequest)
}
