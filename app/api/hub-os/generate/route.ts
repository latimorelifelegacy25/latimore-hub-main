import { NextRequest, NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/ai/shared'
import { buildInstructionBoundaryBlock, sanitizeAiText } from '@/lib/ai/prompt-boundary'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  const body = await req.json().catch(() => null)
  const prompt = body?.prompt
  const systemCtx = body?.systemCtx ?? body?.system ?? ''
  if (!prompt || typeof prompt !== 'string') {
    return NextResponse.json({ error: 'prompt required' }, { status: 400 })
  }

  const cleanPrompt = sanitizeAiText(prompt)
  const cleanSystem = sanitizeAiText(systemCtx)
  const boundedPrompt = buildInstructionBoundaryBlock(cleanSystem, cleanPrompt)

  const provider = (process.env.AI_PROVIDER ?? 'openai').toLowerCase()

  if (provider === 'gemini') {
    const model = process.env.GEMINI_MODEL ?? 'gemini-1.5-flash'
    const normalizedModel = model.startsWith('models/') ? model : `models/${model}`
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${normalizedModel}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(cleanSystem ? { systemInstruction: { parts: [{ text: cleanSystem }] } } : {}),
          contents: [{ role: 'user', parts: [{ text: boundedPrompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1500 },
        }),
        cache: 'no-store',
      }
    )
    const json = await res.json().catch(() => ({}))
    const text =
      json?.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? '').join('') ?? ''
    return NextResponse.json({ text })
  }

  // Default: OpenAI
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'No AI provider configured' }, { status: 500 })
  }
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
      messages: [
        ...(cleanSystem ? [{ role: 'system' as const, content: cleanSystem }] : []),
        { role: 'user' as const, content: boundedPrompt },
      ],
      max_tokens: 1500,
      temperature: 0.7,
    }),
    cache: 'no-store',
  })
  const json = await res.json().catch(() => ({}))
  const text = json?.choices?.[0]?.message?.content ?? ''
  return NextResponse.json({ text })
}
