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

const TASK_TIMEOUT_MS = 120_000

async function runTask(name: string, url: string, req: NextRequest): Promise<TaskResult> {
  const start = Date.now()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TASK_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'x-cron-secret': process.env.CRON_SECRET ?? '',
        'x-forwarded-for': req.headers.get('x-forwarded-for') ?? '',
      },
      signal: controller.signal,
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

  logger.info('[cron/weekly] Starting weekly master cron')
  const cronStart = Date.now()

  const tasks: Array<[string, string]> = [
    ['weekly-report',             `${baseUrl}/api/cron/weekly-report`],
    ['content-publishing',        `${baseUrl}/api/cron/content-publishing`],
    ['lead-scoring',              `${baseUrl}/api/cron/lead-scoring`],
    ['automated-task-generation', `${baseUrl}/api/cron/automated-task-generation`],
  ]
  const settled = await Promise.allSettled(tasks.map(([name, url]) => runTask(name, url, req)))
  const results: TaskResult[] = settled.map((outcome, i) =>
    outcome.status === 'fulfilled'
      ? outcome.value
      : {
          task: tasks[i][0],
          ok: false,
          error: outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason),
          durationMs: Date.now() - cronStart,
        },
  )

  const totalMs   = Date.now() - cronStart
  const succeeded = results.filter(r => r.ok).length
  const failed    = results.filter(r => !r.ok)

  if (failed.length > 0) logger.warn({ failed }, '[cron/weekly] Some tasks failed')
  logger.info({ succeeded, total: results.length, totalMs }, '[cron/weekly] Complete')

  return NextResponse.json({
    ok: failed.length === 0,
    summary: `${succeeded}/${results.length} tasks succeeded`,
    totalDurationMs: totalMs,
    results,
  })
}
