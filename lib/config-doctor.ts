// Environment configuration diagnostics surfaced via /api/health?config=1.
//
// Every check reports only the *shape* of a value (host, port, formatting
// problems) — never the value itself — so the output is safe to show an
// authenticated admin without leaking secrets.

export type ConfigFindingLevel = 'ok' | 'warn' | 'error'

export interface ConfigFinding {
  key: string
  level: ConfigFindingLevel
  message: string
}

const QUOTE_CHARS = /["'“”‘’]/

function looksMangled(value: string): boolean {
  return QUOTE_CHARS.test(value) || /\s/.test(value.trim()) || value.includes('=')
}

function checkDatabaseUrl(findings: ConfigFinding[]) {
  const raw = process.env.DATABASE_URL ?? ''
  if (!raw) {
    findings.push({
      key: 'DATABASE_URL',
      level: 'error',
      message: 'Not set. Every CRM/admin page needs it. Use the Supabase pooled connection (port 6543).',
    })
    return
  }
  if (QUOTE_CHARS.test(raw)) {
    findings.push({
      key: 'DATABASE_URL',
      level: 'error',
      message: 'Contains quote characters — the value was pasted with surrounding quotes. Remove them in the Vercel dashboard.',
    })
    return
  }

  let host = ''
  let port = ''
  let params: URLSearchParams | null = null
  try {
    const parsed = new URL(raw)
    host = parsed.hostname
    port = parsed.port
    params = parsed.searchParams
  } catch {
    findings.push({ key: 'DATABASE_URL', level: 'error', message: 'Not a parseable URL.' })
    return
  }

  const isDirectSupabaseHost = /^db\.[a-z0-9]+\.supabase\.co$/i.test(host)
  if (isDirectSupabaseHost) {
    findings.push({
      key: 'DATABASE_URL',
      level: 'error',
      message:
        `Points at the direct Supabase host (${host}:${port || '5432'}), which is unreachable from Vercel ` +
        '(IPv6-only). Use the pooled connection instead: host aws-0-<region>.pooler.supabase.com, port 6543, ' +
        'username postgres.<project-ref>, with ?pgbouncer=true. This is exactly why admin pages show ' +
        '"database unreachable".',
    })
    return
  }
  if (port === '5432' && host.includes('pooler.supabase.com')) {
    findings.push({
      key: 'DATABASE_URL',
      level: 'warn',
      message: 'Uses the pooler host but port 5432 (session mode). Runtime traffic should use port 6543 with ?pgbouncer=true.',
    })
    return
  }
  if (port === '6543' && params && params.get('pgbouncer') !== 'true') {
    findings.push({
      key: 'DATABASE_URL',
      level: 'warn',
      message: 'Pooled port 6543 without ?pgbouncer=true — Prisma prepared statements will fail intermittently.',
    })
    return
  }
  findings.push({ key: 'DATABASE_URL', level: 'ok', message: `Host ${host}:${port || '(default)'} looks correct.` })
}

function checkUpstash(findings: ConfigFinding[]) {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? ''
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? ''

  if (!url && !token) {
    findings.push({
      key: 'UPSTASH_REDIS_REST_URL',
      level: 'warn',
      message: 'Not set — rate limiting falls back to per-instance memory (fine for low traffic, not shared across regions).',
    })
    return
  }
  if (url.includes('UPSTASH_REDIS_REST_TOKEN') || QUOTE_CHARS.test(url)) {
    findings.push({
      key: 'UPSTASH_REDIS_REST_URL',
      level: 'error',
      message:
        'Mangled — it contains quotes and/or the token line pasted into the same field. Set it to just the ' +
        'https://…upstash.io URL (no quotes) and put the token in UPSTASH_REDIS_REST_TOKEN separately. ' +
        'Because the token was pasted into a URL field it has been printed in error logs — rotate it in Upstash.',
    })
    return
  }
  if (!url.startsWith('https://')) {
    findings.push({ key: 'UPSTASH_REDIS_REST_URL', level: 'error', message: 'Must start with https://.' })
    return
  }
  if (token && looksMangled(token)) {
    findings.push({
      key: 'UPSTASH_REDIS_REST_TOKEN',
      level: 'error',
      message: 'Contains quotes or whitespace — re-paste the raw token value.',
    })
    return
  }
  if (!token) {
    findings.push({ key: 'UPSTASH_REDIS_REST_TOKEN', level: 'error', message: 'URL is set but token is missing.' })
    return
  }
  findings.push({ key: 'UPSTASH_REDIS_REST_URL', level: 'ok', message: 'URL and token look well-formed.' })
}

function checkAiProvider(findings: ConfigFinding[]) {
  const provider = (process.env.AI_PROVIDER ?? 'openai').toLowerCase()
  const keyByProvider: Record<string, string> = {
    openai: 'OPENAI_API_KEY',
    gemini: 'GEMINI_API_KEY',
    anthropic: 'ANTHROPIC_API_KEY',
  }
  const keyName = keyByProvider[provider]
  if (!keyName) {
    findings.push({ key: 'AI_PROVIDER', level: 'error', message: `Unknown provider "${provider}". Use openai, gemini, or anthropic.` })
    return
  }
  const key = process.env[keyName] ?? ''
  if (!key) {
    findings.push({
      key: keyName,
      level: 'error',
      message: `AI_PROVIDER is "${provider}" but ${keyName} is not set — every AI feature (agent, chat, briefs, lead scoring) fails with "Missing ${keyName}".`,
    })
    return
  }
  if (looksMangled(key)) {
    findings.push({ key: keyName, level: 'error', message: 'Contains quotes or whitespace — re-paste the raw key.' })
    return
  }
  findings.push({ key: keyName, level: 'ok', message: `Set for provider "${provider}".` })
}

function checkPresence(
  findings: ConfigFinding[],
  key: string,
  level: ConfigFindingLevel,
  missingMessage: string,
) {
  const value = process.env[key] ?? ''
  if (!value) {
    findings.push({ key, level, message: missingMessage })
    return
  }
  if (looksMangled(value) && key !== 'ADMIN_EMAILS') {
    findings.push({ key, level: 'warn', message: 'Contains quotes or whitespace — likely pasted with surrounding quotes.' })
    return
  }
  findings.push({ key, level: 'ok', message: 'Set.' })
}

export function runConfigDoctor(): { findings: ConfigFinding[]; errors: number; warnings: number } {
  const findings: ConfigFinding[] = []

  checkDatabaseUrl(findings)
  checkUpstash(findings)
  checkAiProvider(findings)
  checkPresence(findings, 'DIRECT_URL', 'warn', 'Not set — prisma migrate deploy will fail. Runtime is unaffected.')
  checkPresence(findings, 'NEXTAUTH_SECRET', 'error', 'Not set — admin login cannot work.')
  checkPresence(findings, 'ADMIN_EMAILS', 'warn', 'Not set — admin access relies solely on the AdminUser table.')
  checkPresence(findings, 'CRON_SECRET', 'warn', 'Not set — scheduled jobs (GitHub Actions / Vercel cron) cannot authenticate, so briefs, lead re-scoring, and publishing never run.')
  checkPresence(findings, 'RESEND_API_KEY', 'warn', 'Not set — lead notification and thank-you emails are silently skipped.')
  checkPresence(findings, 'TOKEN_ENCRYPTION_KEY', 'warn', 'Not set — social/calendar OAuth tokens are stored unencrypted.')

  const errors = findings.filter((f) => f.level === 'error').length
  const warnings = findings.filter((f) => f.level === 'warn').length
  return { findings, errors, warnings }
}
