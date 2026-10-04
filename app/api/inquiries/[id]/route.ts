export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/require-admin'
import { requireAdminRole } from '@/lib/rbac'
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

  // requireAdmin gates on the ADMIN role; fetch the session identity so the
  // audit trail records the real actor instead of a client-supplied string.
  const auth = await requireAdminRole()
  if (!auth.ok) return auth.response
  const actor = auth.email ?? 'admin'

  const { id } = await params

  const body = await req.json().catch(() => null)
  const parse = InquiryPatchSchema.safeParse(body)
  if (!parse.success) {
    return NextResponse.json(
      { ok: false, error: 'Invalid request' },
      { status: 422 }
    )
  }

  try {
    const item = await changeInquiryStage({
      inquiryId: id,
      stage: parse.data.stage,
      notes: parse.data.notes,
      actor,
      // Bypassing the stage-transition guard is ADMIN-only.
      force: auth.role === 'ADMIN' || auth.role === 'DISABLED_AUTH' ? parse.data.force : false,
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