import { NextRequest, NextResponse } from 'next/server'
import { requireCronAuth } from '@/lib/ai/shared'
import { logger } from '@/lib/logger'
import { captureException } from '@/lib/error-tracking'
import { sendGoogleChatMessage } from '@/lib/google-chat'
import { sendMail } from '@/lib/mailer'

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
    const childReportedFailure =
      data !== null &&
      typeof data === 'object' &&
      !Array.isArray(data) &&
      'ok' in data &&
      (data as { ok?: unknown }).ok === false

    return {
      task: name,
      ok: res.ok && !childReportedFailure,
      status: res.status,
      data,
      durationMs: Date.now() - start,
    }
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

async function alertCronFailure(failed: TaskResult[], totalMs: number) {
  const summary = failed
    .map((item) => `${item.task} (${item.status ?? 'no status'}${item.error ? `: ${item.error}` : ''})`)
    .join(', ')

  const message = `Latimore OS daily cron failure: ${summary}. Total runtime: ${totalMs}ms.`
  const alerts: Promise<unknown>[] = [
    captureException(new Error(message), {
      source: 'cron',
      route: '/api/cron/daily',
      failedTasks: failed.map((item) => ({
        task: item.task,
        status: item.status,
        error: item.error,
        durationMs: item.durationMs,
      })),
      totalDurationMs: totalMs,
    }),
  ]

  if (process.env.GOOGLE_CHAT_WEBHOOK_URL) {
    alerts.push(sendGoogleChatMessage(message))
  }

  const to = process.env.NOTIFY_TO ?? process.env.LEAD_NOTIFY_EMAIL
  const from = process.env.THANKYOU_FROM ?? process.env.LEAD_NOTIFY_FROM
  if (to && from) {
    alerts.push(sendMail({
      to,
      from,
      subject: 'Latimore OS alert: daily cron failure',
      html: `<p><strong>Daily cron failure</strong></p><p>${message}</p>`,
    }))
  }

  await Promise.allSettled(alerts)
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
  results.push(await runTask('marketing-scheduled-publish', `${baseUrl}/api/cron/marketing-scheduled-publish`, req))

  const totalMs = Date.now() - cronStart
  const succeeded = results.filter((result) => result.ok).length
  const failed = results.filter((result) => !result.ok)

  const response = {
    ok: failed.length === 0,
    summary: `${succeeded}/${results.length} tasks succeeded`,
    totalDurationMs: totalMs,
    results,
  }

  if (failed.length > 0) {
    logger.error({ failed, succeeded, total: results.length, totalMs }, '[cron/daily] One or more tasks failed')
    await alertCronFailure(failed, totalMs)
    return NextResponse.json(response, { status: 500 })
  }

  logger.info({ succeeded, total: results.length, totalMs }, '[cron/daily] Complete')
  return NextResponse.json(response)
}
