export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { WorkflowOrchestrator } from '@/latimore-os/agent-harness/src/orchestrator'
import { getWorkflow, listRegisteredWorkflowNames } from '@/latimore-os/agent-harness/src/workflows/registry'
import type { WorkerEnv } from '@/latimore-os/agent-harness/src/types'

function secureEqual(expected: string, actual: string | null): boolean {
  if (!actual) return false
  const expectedBuffer = Buffer.from(expected)
  const actualBuffer = Buffer.from(actual)
  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer)
}

function harnessEnv(): WorkerEnv {
  const required = {
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
    RESEND_API_KEY: process.env.RESEND_API_KEY || '',
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '',
    HUB_URL: process.env.HUB_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://latimorelifelegacy.com',
  }

  const missing = Object.entries(required)
    .filter(([key, value]) => key !== 'GEMINI_API_KEY' && !value)
    .map(([key]) => key)

  if (missing.length > 0) {
    throw new Error(`Agent harness configuration missing: ${missing.join(', ')}`)
  }

  return required
}

export async function POST(req: NextRequest) {
  const workerSecret = process.env.WORKER_SECRET
  if (!workerSecret || !secureEqual(workerSecret, req.headers.get('x-worker-secret'))) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  if (process.env.AGENT_HARNESS_ENABLED !== 'true') {
    return NextResponse.json({ ok: false, error: 'agent_harness_disabled' }, { status: 503 })
  }

  const body = await req.json().catch(() => null) as null | {
    workflow?: string
    trigger?: string
    payload?: Record<string, unknown>
  }

  if (!body?.workflow || !body.trigger || !body.payload || typeof body.payload !== 'object') {
    return NextResponse.json({ ok: false, error: 'workflow, trigger, and payload are required' }, { status: 422 })
  }

  const registered = getWorkflow(body.workflow)
  if (!registered) {
    return NextResponse.json({
      ok: false,
      error: 'workflow_not_registered',
      available: listRegisteredWorkflowNames(),
    }, { status: 404 })
  }

  const allowlist = (process.env.AGENT_HARNESS_WORKFLOWS || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean)

  if (allowlist.length > 0 && !allowlist.includes(body.workflow)) {
    return NextResponse.json({ ok: false, error: 'workflow_not_enabled' }, { status: 403 })
  }

  if (registered.definition.trigger.type !== body.trigger && body.trigger !== 'manual') {
    return NextResponse.json({
      ok: false,
      error: 'trigger_mismatch',
      expected: registered.definition.trigger.type,
      received: body.trigger,
    }, { status: 422 })
  }

  try {
    const env = harnessEnv()
    const orchestrator = new WorkflowOrchestrator(env)
    const payload = { ...registered.defaults, ...body.payload }
    const run = await orchestrator.run(registered.definition, body.trigger, payload)

    return NextResponse.json({
      ok: run.status === 'completed',
      run_id: run.id,
      workflow: run.workflow_name,
      version: run.workflow_version,
      status: run.status,
      duration_ms: run.duration_ms ?? null,
      tokens_used: run.tokens_used,
      estimated_cost: run.estimated_cost,
      compliance_passed: run.compliance_passed ?? null,
      error: run.error ?? null,
    }, { status: run.status === 'completed' ? 200 : 500 })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
