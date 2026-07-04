export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { runConfigDoctor } from '@/lib/config-doctor'
import { requireAdminSession, requireCronAuth } from '@/lib/ai/shared'

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown database health check failure'
}

// The config doctor reports env-var shape problems (never values), but that
// is still infrastructure detail — only admins or cron callers may see it.
async function isAuthorizedForConfig(req: NextRequest): Promise<boolean> {
  if (requireCronAuth(req) === null) return true
  try {
    const auth = await requireAdminSession()
    return auth.ok
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  const readinessMode = req.nextUrl.searchParams.get('ready') === '1'
  const wantConfig = req.nextUrl.searchParams.get('config') === '1'

  let dbOk = true
  let dbError: string | null = null
  try {
    await prisma.$queryRaw`SELECT 1`
  } catch (error: unknown) {
    dbOk = false
    dbError = getErrorMessage(error)
  }

  const body: Record<string, unknown> = {
    ok: readinessMode ? dbOk : true,
    db: dbOk ? 'connected' : 'error',
    ts: new Date().toISOString(),
  }
  if (dbError) body.error = dbError

  if (wantConfig) {
    if (await isAuthorizedForConfig(req)) {
      body.config = runConfigDoctor()
    } else {
      body.config = { error: 'unauthorized — sign in as admin or pass the cron secret' }
    }
  }

  return NextResponse.json(body, { status: readinessMode && !dbOk ? 503 : 200 })
}
