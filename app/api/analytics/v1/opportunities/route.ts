export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/ai/shared'
import { rateLimit } from '@/lib/rate-limit'
import { getAnalyticsOpportunities, isOperationalAnalyticsFallbackEnabled, OPERATIONAL_FALLBACK_DISABLED_WARNING } from '@/lib/analytics/queries'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  const limited = await rateLimit(req, 'analytics')
  if (limited) return limited

  try {
    const data = await getAnalyticsOpportunities()
    const now = new Date()

    return NextResponse.json({
      ok: true,
      range: { from: new Date(0).toISOString(), to: now.toISOString() },
      data,
      meta: {
        generatedAt: now.toISOString(),
        source: isOperationalAnalyticsFallbackEnabled() ? 'operational_fallback' : 'disabled',
        warnings: isOperationalAnalyticsFallbackEnabled() ? [] : [OPERATIONAL_FALLBACK_DISABLED_WARNING],
      },
    })
  } catch (err) {
    logger.error({ err }, 'analytics/v1/opportunities error')
    return NextResponse.json({ ok: false, error: 'Failed to load opportunities.' }, { status: 500 })
  }
}
