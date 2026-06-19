export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/require-admin'
import { InquiryPatchSchema } from '@/lib/schemas'
import { logger } from '@/lib/logger'
import { changeInquiryStage } from '@/lib/hub/change-stage'
import { InvalidStageTransitionError } from '@/lib/hub/pipeline-transitions'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin(req, 'inquiries')
  if (authError) return authError

  const { id } = await params

  const body = await req.json().catch(() => null)
  const parse = InquiryPatchSchema.safeParse(body)
  if (!parse.success) {
    return NextResponse.json(
      { ok: false, error: parse.error.flatten() },
      { status: 422 }
    )
  }

  try {
    const item = await changeInquiryStage({
      inquiryId: id,
      stage: parse.data.stage,
      notes: parse.data.notes,
      actor: parse.data.actor ?? 'admin',
      force: parse.data.force,
    })

    logger.info({ inquiryId: id, stage: parse.data.stage }, 'Inquiry stage updated')
    return NextResponse.json({ ok: true, item })
  } catch (err: any) {
    if (err instanceof InvalidStageTransitionError) {
      logger.warn({ inquiryId: id, from: err.from, to: err.to }, 'Rejected invalid stage transition')
      return NextResponse.json(
        { ok: false, error: err.message, code: 'invalid_transition' },
        { status: 409 }
      )
    }
    logger.error({ err: err.message }, 'Inquiry PATCH error')
    const status = /not found/i.test(err.message) ? 404 : 500
    return NextResponse.json(
      { ok: false, error: status === 404 ? 'not found' : 'server error' },
      { status }
    )
  }
}