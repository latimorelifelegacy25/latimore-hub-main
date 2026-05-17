/**
 * POST /api/cron/notification-checks
 * Automated notification system checks
 * Runs every 15 minutes via Vercel cron
 */

import { NextRequest, NextResponse } from 'next/server'
import { runAutomatedNotificationChecks } from '@/lib/notifications'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    logger.info('Running automated notification checks')

    await runAutomatedNotificationChecks()

    logger.info('Notification checks completed successfully')

    return NextResponse.json({
      success: true,
      message: 'Notification checks completed',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    logger.error({ error }, 'Failed to run notification checks')

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Also support POST for manual triggering
export async function POST(req: NextRequest) {
  return GET()
}