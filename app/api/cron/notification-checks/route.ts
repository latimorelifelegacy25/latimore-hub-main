export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { runAutomatedNotificationChecks } from '@/lib/notifications'
import { logger } from '@/lib/logger'

function authorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false
  const header =
    req.headers.get('x-cron-secret') ?? req.headers.get('authorization')?.replace('Bearer ', '')
  return header === cronSecret
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  try {
    logger.info('Running automated notification checks')
    await runAutomatedNotificationChecks()
    logger.info('Notification checks completed successfully')
    return NextResponse.json({
      success: true,
      message: 'Notification checks completed',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error({ error }, 'Failed to run notification checks')
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  return GET(req)
}
