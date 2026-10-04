import { NextRequest, NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/ai/shared'
import { rateLimit } from '@/lib/rate-limit'
import { analyzeSentiment } from '@/lib/ai/model-router'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, 'reports')
  if (limited) return limited

  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  try {
    const { text, targetType, targetId } = await req.json()
    if (!text?.trim()) return NextResponse.json({ error: 'text is required' }, { status: 400 })

    const { result, model, provider } = await analyzeSentiment(text)

    const analysis = await prisma.aIAnalysis.create({
      data: {
        targetType: targetType ?? 'manual',
        targetId: targetId ?? 'manual',
        provider,
        model,
        sentiment: result.sentiment,
        confidence: result.confidence,
        intent: result.intent,
        urgency: result.urgency,
        topics: result.topics,
        complianceRisk: result.compliance_risk,
        suggestedAction: result.recommended_action,
        raw: result as object,
      },
    })

    return NextResponse.json({ ok: true, analysis, result })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Analysis failed' }, { status: 500 })
  }
}
