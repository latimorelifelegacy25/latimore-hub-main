import { NextRequest, NextResponse } from 'next/server'
import { requireCronAuth } from '@/lib/ai/shared'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 300

type TaskResult = {
  task: string
  ok: boolean
  status?: number
  data?: unknown
  error?: string
  durationMs: number
}

const TASK_TIMEOUT_MS = 45_000

async function runTask(name: string, url: string, req: NextRequest, method: 'GET' | 'POST' = 'GET'): Promise<TaskResult> {
  const start = Date.now()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TASK_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      method,
      headers: {
        'content-type': 'application/json',
        'x-cron-secret': process.env.CRON_SECRET ?? '',
        'x-forwarded-for': req.headers.get('x-forwarded-for') ?? '',
      },
      signal: controller.signal,
      ...(method === 'POST' ? { body: JSON.stringify({ days: 7 }) } : {}),
    })
    const data = await res.json().catch(() => null)
    return { task: name, ok: res.ok, status: res.status, data, durationMs: Date.now() - start }
  } catch (err) {
    const timedOut = err instanceof Error && err.name === 'AbortError'
    return {
      task: name,
      ok: false,
      error: timedOut ? `Timed out after ${TASK_TIMEOUT_MS}ms` : err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - start,
    }
  } finally {
    clearTimeout(timeout)
  }
}

export async function GET(req: NextRequest) {
  const authError = requireCronAuth(req)
  if (authError) return authError

  const baseUrl = process.env.NEXTAUTH_URL
    ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  logger.info('[cron/daily] Starting daily master cron')
  const cronStart = Date.now()

  const results: TaskResult[] = []
  results.push(await runTask('daily-brief',           `${baseUrl}/api/cron/daily-brief`,           req))
  results.push(await runTask('analytics-rebuild',     `${baseUrl}/api/analytics/v1/jobs/run`,      req, 'POST'))
  results.push(await runTask('lead-score-updates',    `${baseUrl}/api/cron/lead-score-updates`,    req))
  results.push(await runTask('appointment-reminders', `${baseUrl}/api/cron/appointment-reminders`, req))
  results.push(await runTask('notification-checks',   `${baseUrl}/api/cron/notification-checks`,   req))
  results.push(await runTask('social-sync',           `${baseUrl}/api/cron/social-sync`,           req))

  const totalMs   = Date.now() - cronStart
  const succeeded = results.filter(r => r.ok).length
  const failed    = results.filter(r => !r.ok)

  if (failed.length > 0) logger.warn({ failed }, '[cron/daily] Some tasks failed')
  logger.info({ succeeded, total: results.length, totalMs }, '[cron/daily] Complete')

  return NextResponse.json({
    ok: failed.length === 0,
    summary: `${succeeded}/${results.length} tasks succeeded`,
    totalDurationMs: totalMs,
    results,
  })
}
