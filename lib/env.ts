import { z } from 'zod'

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
})

export const env = EnvSchema.parse(process.env)

export const isProduction = env.NODE_ENV === 'production'

// Skip the runtime safety gates during `next build`'s page-data collection
// phase, where env vars from the deploy target may not yet be available.
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build'

if (isProduction && !isBuildPhase) {
  if (env.DISABLE_ADMIN_AUTH === 'true') {
    throw new Error('DISABLE_ADMIN_AUTH=true is forbidden when NODE_ENV=production')
  }

  const adminEmails = (env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean)

  if (adminEmails.length === 0) {
    throw new Error('ADMIN_EMAILS must be set to a non-empty list when NODE_ENV=production')
  }

  if (!env.CRON_SECRET) {
    throw new Error('CRON_SECRET must be set when NODE_ENV=production')
  }
}
