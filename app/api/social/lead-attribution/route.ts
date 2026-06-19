import { NextRequest, NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/ai/shared'
import { getLeadAttribution, rangeFromDays } from '@/lib/engagement/executive'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  const url = new URL(req.url)
  const days = Number(url.searchParams.get('days') ?? '30')
  const platform = url.searchParams.get('platform')
  const data = await getLeadAttribution(rangeFromDays(days, platform))
  return NextResponse.json({ ok: true, ...data })
}
