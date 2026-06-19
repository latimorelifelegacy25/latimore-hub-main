export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateEnv, isProduction } = await import('@/lib/env')
    if (isProduction) validateEnv()
  }
}
