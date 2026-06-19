export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { AiRunType } from '@prisma/client'
import { createOpenAIJsonCompletion } from '@/lib/ai/client'
import { getContactAiContext } from '@/lib/ai/contact-context'
import { applyAiRateLimit, completeAiRun, createAiRun, createSystemAiEvent, failAiRun, requireAdminSession } from '@/lib/ai/shared'

const BodySchema = z.object({
  contactId: z.string().uuid().optional().nullable(),
  inquiryId: z.string().uuid().optional().nullable(),
  question: z.string().min(3).max(2000),
}).refine(
  (data) => data.contactId || data.inquiryId,
  { message: 'Either contactId or inquiryId is required.' }
)

const schema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    answer: { type: 'string' },
    suggestedActions: { type: 'array', items: { type: 'string' } },
    draftReply: { type: ['string', 'null'] },
  },
  required: ['answer', 'suggestedActions', 'draftReply'],
}

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
    const context = await getContactAiContext(parsed.data)
    const aiRun = await createAiRun({
      type: AiRunType.crm_assistant,
      contactId: context.contact.id,
      inquiryId: context.inquiry?.id ?? undefined,
      input: { request: parsed.data, context },
    })
    aiRunId = aiRun.id

    const completion = await createOpenAIJsonCompletion<any>({
      system: 'You are the Latimore CRM AI Assistant. Answer the advisor\'s question grounded only in the provided CRM context. Suggest concrete next actions and, if relevant, draft a brief reply the advisor could send.',
      user: JSON.stringify({ task: 'Answer the question about this contact', question: parsed.data.question, context }),
      schemaName: 'crm_assistant',
      schema,
      temperature: 0.2,
    })

    const output = { contactId: context.contact.id, inquiryId: context.inquiry?.id ?? null, result: completion.output }
    await completeAiRun({
      aiRunId,
      output: output as Record<string, unknown>,
      model: completion.model,
      tokensInput: completion.usage?.input_tokens,
      tokensOutput: completion.usage?.output_tokens,
      latencyMs: Date.now() - startedAt,
    })
    await createSystemAiEvent({
      type: 'ai.crm_assistant.completed',
      contactId: context.contact.id,
      inquiryId: context.inquiry?.id ?? undefined,
      payload: output as Record<string, unknown>,
    })
    return NextResponse.json({ ok: true, ...output })
  } catch (error) {
    return failAiRun({ aiRunId, error })
  }
}
