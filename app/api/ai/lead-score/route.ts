export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { AiRunType } from '@prisma/client'
import {
  applyAiRateLimit,
  requireAdminSession,
  createAiRun,
  completeAiRun,
  failAiRun,
  createSystemAiEvent,
} from '@/lib/ai/shared'
import { computeLeadScore } from '@/lib/ai/lead-score'

/**
 * Validate body and ensure at least one ID is present.
 */
const BodySchema = z.object({
  contactId: z.string().uuid().optional().nullable(),
  inquiryId: z.string().uuid().optional().nullable(),
}).refine(
  (data) => data.contactId || data.inquiryId,
  { message: 'Either contactId or inquiryId is required.' }
)

export async function POST(req: NextRequest) {
  const startedAt = Date.now()
  const limited = await applyAiRateLimit(req)
  if (limited) return limited

  // Cron or admin auth
  const cronSecret = process.env.CRON_SECRET
  const isCron = Boolean(cronSecret && req.headers.get('x-cron-secret') === cronSecret)

  if (!isCron) {
    const auth = await requireAdminSession()
    if (!auth.ok) return auth.response
  }

  // Parse + validate body
  const body = await req.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const { contactId, inquiryId } = parsed.data
  let aiRunId: string | undefined

  try {
    // Create AI run
    const aiRun = await createAiRun({
      type: AiRunType.lead_score,
      contactId: contactId ?? undefined,
      inquiryId: inquiryId ?? undefined,
      input: parsed.data,
      model: 'rules-engine',
    })

    aiRunId = aiRun.id

    // Compute score
    const result = await computeLeadScore(parsed.data)

    // Complete AI run
    await completeAiRun({
      aiRunId,
      output: result as Record<string, unknown>,
      model: 'rules-engine',
      latencyMs: Date.now() - startedAt,
    })

    // Emit system event
    await createSystemAiEvent({
      type: 'ai.lead_score.completed',
      contactId: contactId ?? result.contactId,
      inquiryId: inquiryId ?? result.inquiryId,
      payload: result as Record<string, unknown>,
    })

    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    console.error('Lead score error:', error)
    return failAiRun({ aiRunId, error })
  }
}
