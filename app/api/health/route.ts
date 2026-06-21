export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown database health check failure'
}

export async function GET(req: NextRequest) {
  const readinessMode = req.nextUrl.searchParams.get('ready') === '1'

  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ ok: true, db: 'connected', ts: new Date().toISOString() })
  } catch (error: unknown) {
    const body = {
      ok: !readinessMode,
      db: 'error',
      error: getErrorMessage(error),
      ts: new Date().toISOString(),
    }

    return NextResponse.json(body, { status: readinessMode ? 503 : 200 })
  }
}
