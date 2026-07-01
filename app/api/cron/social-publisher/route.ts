export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { publishDueSocialPosts } from '@/lib/social/publisher'
import { requireCronAuth } from '@/lib/ai/shared'

export async function GET(request: NextRequest) {
  const unauthorized = requireCronAuth(request)
  if (unauthorized) return unauthorized

  const results = await publishDueSocialPosts(10)
  return NextResponse.json({ ok: true, results })
}
