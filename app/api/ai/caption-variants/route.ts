export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { AiRunType } from '@prisma/client'
import { createOpenAIJsonCompletion } from '@/lib/ai/client'
import { captionVariantsPrompt } from '@/lib/ai/prompts'
import { applyAiRateLimit, completeAiRun, createAiRun, failAiRun, requireAdminSession } from '@/lib/ai/shared'

const BodySchema = z.object({
  originalCaption: z.string().min(3).max(2000),
  audience: z.string().min(1).max(200).default('families and homeowners'),
  variantCount: z.number().int().min(1).max(5).default(3),
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
    const aiRun = await createAiRun({
      type: AiRunType.content_generation,
      input: { task: 'caption_variants', ...parsed.data },
    })
    aiRunId = aiRun.id

    const { system, user, schema, schemaName } = captionVariantsPrompt(parsed.data)
    const completion = await createOpenAIJsonCompletion<any>({
      system,
      user,
      schemaName,
      schema,
      temperature: 0.7,
    })

    await completeAiRun({
      aiRunId,
      output: completion.output as Record<string, unknown>,
      model: completion.model,
      tokensInput: completion.usage?.input_tokens,
      tokensOutput: completion.usage?.output_tokens,
      latencyMs: Date.now() - startedAt,
    })

    return NextResponse.json({ ok: true, result: completion.output, model: completion.model })
  } catch (error) {
    return failAiRun({ aiRunId, error })
  }
}
