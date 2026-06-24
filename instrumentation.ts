export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateEnv, isProduction } = await import('@/lib/env')
    if (isProduction) {
      try {
        validateEnv()
      } catch (err) {
        // Never let a missing env var crash server "prepare" — that takes
        // down every route on this serverless instance, not just the
        // feature that depends on the missing var. Log loudly instead.
        const { logger } = await import('@/lib/logger')
        logger.error({ err }, '[instrumentation] validateEnv failed')
      }
    }
  }
}
