import { NextRequest, NextResponse } from 'next/server'
import { publishDueSocialPosts } from '@/lib/social/publisher'

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : null

  if (expected && auth !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = await publishDueSocialPosts(10)
  return NextResponse.json({ ok: true, results })
}
