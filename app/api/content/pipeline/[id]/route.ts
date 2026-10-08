export const dynamic = 'force-dynamic'
export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { applyAiRateLimit, requireAdminSession } from '@/lib/ai/shared'
import { requireReviewerRole } from '@/lib/rbac'
import { logger } from '@/lib/logger'
import {
  decideVariant,
  getVariants,
  loadPipeline,
  PipelineError,
  rebrief,
  repurpose,
  replaceDraft,
  reviewCurrent,
  runDraftLoop,
} from '@/lib/ai/content-pipeline/pipeline'

const ActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('provide_input'), material: z.string().min(1).max(20000) }),
  z.object({ action: z.literal('draft'), voiceNotes: z.string().max(4000).optional() }),
  z.object({ action: z.literal('edit_draft'), text: z.string().min(50).max(50000) }),
  z.object({ action: z.literal('review') }),
  z.object({ action: z.literal('repurpose') }),
  z.object({ action: z.literal('approve_variant'), variantId: z.string().min(1) }),
  z.object({ action: z.literal('reject_variant'), variantId: z.string().min(1) }),
])

type Ctx = { params: Promise<{ id: string }> }

async function detail(id: string) {
  const { asset, state } = await loadPipeline(id)
  return { id, title: asset.title, draft: asset.bodyText, state, variants: await getVariants(id) }
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response
  try {
    return NextResponse.json({ ok: true, ...(await detail((await ctx.params).id)) })
  } catch (error) {
    return fail(error)
  }
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const limited = await applyAiRateLimit(req)
  if (limited) return limited

  const parsed = ActionSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 422 })
  const body = parsed.data

  // Staging variants and every go / no-go decision belong to a reviewer (Jackson), not any agent role.
  const needsReviewer =
    body.action === 'repurpose' || body.action === 'approve_variant' || body.action === 'reject_variant'
  const auth = needsReviewer ? await requireReviewerRole() : await requireAdminSession()
  if (!auth.ok) return auth.response

  try {
    const { id } = await ctx.params
    switch (body.action) {
      case 'provide_input':
        await rebrief(id, body.material)
        break
      case 'draft':
        await runDraftLoop(id, body.voiceNotes)
        break
      case 'edit_draft':
        await replaceDraft(id, body.text)
        break
      case 'review':
        await reviewCurrent(id)
        break
      case 'repurpose':
        await repurpose(id)
        break
      case 'approve_variant':
      case 'reject_variant':
        await decideVariant(id, body.variantId, body.action === 'approve_variant' ? 'approve' : 'reject', auth.email)
        break
    }
    return NextResponse.json({ ok: true, ...(await detail(id)) })
  } catch (error) {
    return fail(error)
  }
}

function fail(error: unknown) {
  if (error instanceof PipelineError) return NextResponse.json({ ok: false, error: error.message }, { status: error.status })
  logger.error({ error }, 'Content pipeline request failed')
  return NextResponse.json({ ok: false, error: 'Pipeline request failed' }, { status: 500 })
}
