import { logger } from '@/lib/logger'

export type ErrorContext = {
  source: 'webhook' | 'booking' | 'notification' | 'supabase' | 'api'
  inquiryId?: string | null
  contactId?: string | null
  leadSessionId?: string | null
  [key: string]: unknown
}

/**
 * Single funnel for exception reporting across webhook, booking, notification
 * and Supabase call sites. Always logs locally via pino; additionally forwards
 * to Sentry's HTTP envelope endpoint when SENTRY_DSN is configured, without
 * requiring the Sentry SDK as a build dependency. Never throws — a failure to
 * report an error must not mask or replace the original error.
 */
export async function captureException(error: unknown, context: ErrorContext): Promise<void> {
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined

  logger.error({ err: message, stack, ...context }, `[${context.source}] ${message}`)

  const dsn = process.env.SENTRY_DSN
  if (!dsn) return

  try {
    await reportToSentry(dsn, message, stack, context)
  } catch (reportErr) {
    logger.warn({ err: reportErr instanceof Error ? reportErr.message : String(reportErr) }, 'Sentry report failed')
  }
}

function reportToSentry(dsn: string, message: string, stack: string | undefined, context: ErrorContext) {
  const parsed = new URL(dsn)
  const projectId = parsed.pathname.replace(/^\//, '')
  const ingestUrl = `${parsed.protocol}//${parsed.host}/api/${projectId}/store/`
  const authHeader = `Sentry sentry_version=7, sentry_key=${parsed.username}, sentry_client=latimore-hub/1.0`

  const event = {
    message,
    level: 'error',
    extra: context,
    exception: stack
      ? { values: [{ type: 'Error', value: message, stacktrace: { frames: parseStackFrames(stack) } }] }
      : undefined,
    tags: { source: context.source },
  }

  return fetch(ingestUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Sentry-Auth': authHeader },
    body: JSON.stringify(event),
  })
}

function parseStackFrames(stack: string) {
  return stack
    .split('\n')
    .slice(1)
    .map((line) => ({ filename: line.trim() }))
}
