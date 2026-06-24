import { z } from 'zod'
import { logger } from '@/lib/logger'

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),
  NEXTAUTH_SECRET: z.string().optional(),
  NEXTAUTH_URL: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  ADMIN_EMAILS: z.string().optional(),
  DISABLE_ADMIN_AUTH: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  GOOGLE_CHAT_WEBHOOK_URL: z.string().optional(),
  NEXT_PUBLIC_GA_ID: z.string().optional(),
  NEXT_PUBLIC_GTM_ID: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
})

export const env = EnvSchema.parse(process.env)

export const isProduction = env.NODE_ENV === 'production'

// Skip the runtime safety gates during `next build`'s page-data collection
// phase, where env vars from the deploy target may not yet be available.
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build'

// Vars that must be present in every production environment. GA/GTM IDs are
// intentionally excluded — they're optional marketing pixels, not part of
// the lead pipeline.
const REQUIRED_IN_PRODUCTION = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'RESEND_API_KEY',
  'GOOGLE_CHAT_WEBHOOK_URL',
  // UPSTASH_REDIS_REST_URL/TOKEN are intentionally NOT required here —
  // lib/rate-limit.ts already falls back to an in-memory limiter when they're
  // absent, so missing Upstash config degrades rate limiting, it doesn't
  // break the app.
] as const

/**
 * Throws if any var in REQUIRED_IN_PRODUCTION is missing. Call this at
 * startup (see instrumentation.ts) so a misconfigured deploy fails fast
 * instead of silently dropping leads, emails, or notifications at runtime.
 */
export function validateEnv(): void {
  const missing = REQUIRED_IN_PRODUCTION.filter((key) => !process.env[key])
  if (missing.length > 0) {
    throw new Error(`Missing env: ${missing.join(', ')}`)
  }
}

// Importing this module must never crash the importing route. `lib/auth.ts`
// and `instrumentation.ts` pull this in, and instrumentation runs on every
// serverless cold start across the whole app — a thrown error here previously
// took down every route (blog, API, everything), not just the
// auth/admin/cron features that actually depend on these vars. Misconfigs are
// logged loudly instead so they're visible without taking the site down.
if (isProduction && !isBuildPhase) {
  if (env.DISABLE_ADMIN_AUTH === 'true') {
    logger.error('[env] DISABLE_ADMIN_AUTH=true is forbidden when NODE_ENV=production')
  }

  const adminEmails = (env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean)

  if (adminEmails.length === 0) {
    logger.error('[env] ADMIN_EMAILS must be set to a non-empty list when NODE_ENV=production')
  }

  if (!env.CRON_SECRET) {
    logger.error('[env] CRON_SECRET must be set when NODE_ENV=production')
  }

  try {
    validateEnv()
  } catch (err) {
    logger.error({ err }, '[env] validateEnv failed')
  }
}
