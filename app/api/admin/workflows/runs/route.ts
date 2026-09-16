export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAdminSession } from '@/lib/ai/shared'

export type WorkflowRunRow = {
  id: string
  created_at: Date
  workflow_name: string
  workflow_version: string | null
  trigger_type: string | null
  status: string
  started_at: Date | null
  completed_at: Date | null
  duration_ms: number | null
  steps: unknown
  error: string | null
  compliance_passed: boolean | null
  compliance_notes: string | null
  tokens_used: number | bigint | null
  estimated_cost: number | Prisma.Decimal | null
}

type AuditRow = {
  id: string
  created_at: Date
  action: string
  actor_label: string | null
  entity_id: string
  after_state: unknown
}

function numeric(value: number | bigint | Prisma.Decimal | null | undefined): number {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return value
  if (typeof value === 'bigint') return Number(value)
  return Number(value.toString())
}

export async function GET() {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  try {
    const [runs, audit] = await Promise.all([
      prisma.$queryRaw<WorkflowRunRow[]>(Prisma.sql`
        SELECT
          id::text,
          created_at,
          workflow_name,
          workflow_version,
          trigger_type,
          status::text,
          started_at,
          completed_at,
          duration_ms,
          steps,
          error,
          compliance_passed,
          compliance_notes,
          tokens_used,
          estimated_cost
        FROM workflow_runs
        ORDER BY created_at DESC
        LIMIT 100
      `),
      prisma.$queryRaw<AuditRow[]>(Prisma.sql`
        SELECT
          id::text,
          created_at,
          action,
          actor_label,
          entity_id::text,
          after_state
        FROM audit_log
        WHERE entity_type = 'workflow_run'
        ORDER BY created_at DESC
        LIMIT 100
      `),
    ])

    const completed = runs.filter(run => run.status === 'completed').length
    const failed = runs.filter(run => run.status === 'failed').length
    const running = runs.filter(run => run.status === 'running').length
    const totalTokens = runs.reduce((sum, run) => sum + numeric(run.tokens_used), 0)
    const totalEstimatedCost = runs.reduce((sum, run) => sum + numeric(run.estimated_cost), 0)
    const completedDurations = runs.map(run => run.duration_ms).filter((value): value is number => typeof value === 'number')
    const averageDurationMs = completedDurations.length
      ? completedDurations.reduce((sum, value) => sum + value, 0) / completedDurations.length
      : 0

    return NextResponse.json({
      ok: true,
      data: {
        metrics: {
          totalRuns: runs.length,
          completed,
          failed,
          running,
          successRate: runs.length ? completed / runs.length : 0,
          totalTokens,
          totalEstimatedCost,
          averageDurationMs,
        },
        runs: runs.map(run => ({
          ...run,
          tokens_used: numeric(run.tokens_used),
          estimated_cost: numeric(run.estimated_cost),
        })),
        audit,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const relationMissing = /workflow_runs|audit_log|does not exist|relation/i.test(message)

    return NextResponse.json({
      ok: false,
      available: false,
      error: relationMissing
        ? 'Latimore OS workflow tables are not available in the connected production database yet.'
        : 'Failed to load workflow telemetry.',
      detail: process.env.NODE_ENV === 'development' ? message : undefined,
    }, { status: relationMissing ? 503 : 500 })
  }
}
