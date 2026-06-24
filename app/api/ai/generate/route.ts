import { NextRequest, NextResponse } from 'next/server'
import { createTextCompletion } from '@/lib/ai/client'
import { requireAdminSession } from '@/lib/ai/shared'
import { buildInstructionBoundaryBlock, sanitizeAiText } from '@/lib/ai/prompt-boundary'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  const body = await req.json().catch(() => null)
  const prompt = body?.prompt
  const systemCtx = body?.systemCtx ?? body?.system ?? ''

  if (!prompt || typeof prompt !== 'string') {
    return NextResponse.json({ error: 'A valid text prompt is required.' }, { status: 400 })
  }

  try {
    const cleanSystem = sanitizeAiText(systemCtx)
    const cleanPrompt = sanitizeAiText(prompt)
    const boundedPrompt = buildInstructionBoundaryBlock(cleanSystem, cleanPrompt)

    const text = await createTextCompletion({
      system: cleanSystem || 'You are Latimore Hub OS, a concise business operations assistant.',
      user: boundedPrompt,
      temperature: typeof body?.temperature === 'number' ? body.temperature : 0.8,
    })

    return NextResponse.json({ text })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Serverless generation exception occurred'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
