import { NextRequest, NextResponse } from 'next/server'
import { BRAND } from '@/lib/brand'
import { rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

function copyUtmParams(from: URL, to: URL) {
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
    const value = from.searchParams.get(key)
    if (value) to.searchParams.set(key, value)
  }
}

export async function GET(req: NextRequest) {
  try {
    const limited = await rateLimit(req, 'ethos_redirect')
    if (limited) return limited
  } catch (error) {
    console.error('[ethos_redirect] rate limit check failed; continuing to redirect', error)
  }

  const url = new URL(req.url)
  const ethos = new URL(BRAND.ethosQuoteUrl)
  copyUtmParams(url, ethos)

  return NextResponse.redirect(ethos.toString(), { status: 302 })
}
