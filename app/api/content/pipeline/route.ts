export const dynamic = 'force-dynamic'
export const maxDuration = 120

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { applyAiRateLimit, requireAdminSession } from '@/lib/ai/shared'
import { createPipeline, listPipelines, PipelineError } from '@/lib/ai/content-pipeline/pipeline'

const CreateSchema = z.object({
  topic: z.string().min(5).max(300),
  sourceMaterial: z.string().min(1).max(20000),
  channelGoals: z.string().max(2000).default(''),
  campaign: z.string().max(150).optional(),
})

export async function GET() {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response
  const items = await listPipelines()
  return NextResponse.json({
    ok: true,
    pipelines: items.map(({ asset, state }) => ({
      id: asset.id,
      title: asset.title,
      stage: state.stage,
      draftRevision: state.draftRevision,
      createdAt: asset.createdAt,
    })),
  })
}

// Steps 1-2: Jackson's idea in, Strategist's shared brief out. Nothing is drafted or sent yet.
export async function POST(req: NextRequest) {
  const limited = await applyAiRateLimit(req)
  if (limited) return limited
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  const parsed = CreateSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 422 })

  try {
    const { asset, state } = await createPipeline({ ...parsed.data, createdBy: auth.email })
    return NextResponse.json({ ok: true, id: asset.id, state })
  } catch (error) {
    if (error instanceof PipelineError) return NextResponse.json({ ok: false, error: error.message }, { status: error.status })
    logger.error({ error }, 'Content pipeline create failed')
    return NextResponse.json({ ok: false, error: 'Pipeline run failed' }, { status: 500 })
  }
}
