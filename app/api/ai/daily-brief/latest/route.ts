export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { AiRunStatus, AiRunType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { applyAiRateLimit, requireAdminSession } from '@/lib/ai/shared'
import { logger } from '@/lib/logger'

type DailyBriefOutput = {
  generatedAt?: string
  brief?: unknown
}

export async function GET(req: NextRequest) {
  const limited = await applyAiRateLimit(req)
  if (limited) return limited

  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  try {
    const latest = await prisma.aiRun.findFirst({
      where: {
        type: AiRunType.daily_brief,
        status: AiRunStatus.succeeded,
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, createdAt: true, output: true },
    })

    if (!latest?.output) {
      return NextResponse.json({ ok: false, error: 'No saved daily brief found.' }, { status: 404 })
    }

    const output = latest.output as DailyBriefOutput
    return NextResponse.json({
      ok: true,
      cached: true,
      aiRunId: latest.id,
      generatedAt: output.generatedAt ?? latest.createdAt.toISOString(),
      brief: output.brief,
    })
  } catch (error) {
    logger.error({ error }, 'ai/daily-brief/latest error')
    return NextResponse.json({ ok: false, error: 'Failed to load latest daily brief.' }, { status: 500 })
  }
}
