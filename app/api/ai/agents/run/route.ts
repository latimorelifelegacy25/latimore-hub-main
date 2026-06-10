export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { AiRunType } from '@prisma/client'
import { getContactAiContext } from '@/lib/ai/contact-context'
import { runAgentWorkflow } from '@/lib/ai/agents'
import { applyAiRateLimit, completeAiRun, createAiRun, createSystemAiEvent, failAiRun, requireAdminSession } from '@/lib/ai/shared'

const BodySchema = z.object({
  goal: z.string().min(3).max(2000),
  contactId: z.string().uuid().optional().nullable(),
  inquiryId: z.string().uuid().optional().nullable(),
  maxRetries: z.number().int().min(0).max(2).optional(),
})

export async function POST(req: NextRequest) {
  const startedAt = Date.now()
  const limited = await applyAiRateLimit(req)
  if (limited) return limited

  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  const body = await req.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 422 })
  }

  let aiRunId: string | undefined
  try {
    const context = parsed.data.contactId || parsed.data.inquiryId
      ? await getContactAiContext({ contactId: parsed.data.contactId, inquiryId: parsed.data.inquiryId })
      : null

    const aiRun = await createAiRun({
      type: AiRunType.agent_workflow,
      contactId: context?.contact.id,
      inquiryId: context?.inquiry?.id,
      input: { goal: parsed.data.goal, maxRetries: parsed.data.maxRetries ?? 1, context },
    })
    aiRunId = aiRun.id

    const { result, usage } = await runAgentWorkflow({
      goal: parsed.data.goal,
      context,
      maxRetries: parsed.data.maxRetries,
    })

    const output = { contactId: context?.contact.id ?? null, inquiryId: context?.inquiry?.id ?? null, result }
    await completeAiRun({
      aiRunId,
      output: output as unknown as Record<string, unknown>,
      model: usage.model,
      tokensInput: usage.tokensInput,
      tokensOutput: usage.tokensOutput,
      latencyMs: Date.now() - startedAt,
    })
    await createSystemAiEvent({
      type: 'ai.agent_workflow.completed',
      contactId: context?.contact.id,
      inquiryId: context?.inquiry?.id,
      payload: output as unknown as Record<string, unknown>,
    })
    return NextResponse.json({ ok: true, ...output })
  } catch (error) {
    return failAiRun({ aiRunId, error })
  }
}
