import { NextRequest, NextResponse } from 'next/server'
import { requireCronAuth } from '@/lib/ai/shared'
import { prisma } from '@/lib/prisma'
import { AnalyticsJobStatus } from '@prisma/client'
import { syncFacebookAccountMetrics, syncInstagramAccountMetrics } from '@/lib/social/account-metrics-sync'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const unauthorized = requireCronAuth(req)
  if (unauthorized) return unauthorized

  const jobRun = await prisma.analyticsJobRun.create({
    data: { jobKey: 'social_account_metrics_sync', status: AnalyticsJobStatus.running },
  })

  const results = await Promise.all([
    syncFacebookAccountMetrics().catch((err) => ({
      platform: 'facebook' as const,
      status: 'failed' as const,
      error: err instanceof Error ? err.message : String(err),
    })),
    syncInstagramAccountMetrics().catch((err) => ({
      platform: 'instagram' as const,
      status: 'failed' as const,
      error: err instanceof Error ? err.message : String(err),
    })),
  ])

  const rowsProcessed = results.filter((r) => r.status === 'synced').length
  const failed = results.find((r) => r.status === 'failed')

  await prisma.analyticsJobRun.update({
    where: { id: jobRun.id },
    data: {
      status: failed ? AnalyticsJobStatus.failed : AnalyticsJobStatus.succeeded,
      finishedAt: new Date(),
      rowsProcessed,
      error: failed?.error,
      metadata: { results },
    },
  })

  return NextResponse.json({ ok: true, jobRunId: jobRun.id, results })
}
