import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { AiRunStatus, AiRunType } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'
import type { Prisma } from '@prisma/client'

export async function requireAdminSession() {
  if (process.env.DISABLE_ADMIN_AUTH === 'true') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('DISABLE_ADMIN_AUTH=true is forbidden when NODE_ENV=production')
    }
    return { ok: true as const, session: null }
  }
  const session = await getServerSession(authOptions)
  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 }),
    }
  }
  return { ok: true as const, session }
}

export async function applyAiRateLimit(req: NextRequest) {
  return rateLimit(req, 'reports')
}

export function requireCronAuth(req: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET
  const header =
    req.headers.get('x-cron-secret') ??
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!secret || !header) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  const secretBuf = Buffer.from(secret)
  const headerBuf = Buffer.from(header)
  const valid =
    secretBuf.length === headerBuf.length && timingSafeEqual(secretBuf, headerBuf)
  if (!valid) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  return null
}

export async function createAiRun(input: {
  type: AiRunType
  contactId?: string | null
  inquiryId?: string | null
  input: Record<string, unknown>
  model?: string
}) {
  return prisma.aiRun.create({
    data: {
      type: input.type,
      status: AiRunStatus.running,
      contactId: input.contactId ?? undefined,
      inquiryId: input.inquiryId ?? undefined,
      input: input.input as Prisma.InputJsonValue,
      model: input.model,
    },
  })
}

export async function completeAiRun(input: {
  aiRunId: string
  output: Record<string, unknown>
  model?: string
  tokensInput?: number
  tokensOutput?: number
  latencyMs?: number
}) {
  return prisma.aiRun.update({
    where: { id: input.aiRunId },
    data: {
      status: AiRunStatus.succeeded,
      output: input.output as Prisma.InputJsonValue,
      model: input.model,
      tokensInput: input.tokensInput,
      tokensOutput: input.tokensOutput,
      latencyMs: input.latencyMs,
    },
  })
}

export async function failAiRun(input: { aiRunId?: string; error: unknown }) {
  const message = input.error instanceof Error ? input.error.message : String(input.error)
  if (input.aiRunId) {
    try {
      await prisma.aiRun.update({
        where: { id: input.aiRunId },
        data: { status: AiRunStatus.failed, error: message },
      })
    } catch (error) {
      logger.error({ error, aiRunId: input.aiRunId }, 'Failed updating ai run')
    }
  }
  return NextResponse.json({ ok: false, error: message }, { status: 500 })
}

export async function createSystemAiEvent(input: {
  type: string
  contactId?: string | null
  inquiryId?: string | null
  payload: Record<string, unknown>
}) {
  try {
    await prisma.systemEvent.create({
      data: {
        type: input.type,
        contactId: input.contactId ?? undefined,
        inquiryId: input.inquiryId ?? undefined,
        payload: input.payload as Prisma.InputJsonValue,
      },
    })
  } catch (error) {
    logger.error({ error, input }, 'Failed creating system event')
  }
}

export function toIso(value?: Date | string | null): string | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export const AI_CANONICAL_FOUNDER_STORY = `Founder story context:
- Jackson M. Latimore Sr. survived sudden cardiac arrest on December 7, 2010, while playing basketball at East Stroudsburg University.
- An AED placed through the Gregory W. Moyer Defibrillator Fund helped save his life.
- Greg Moyer died of sudden cardiac arrest in 2000; Rachel Moyer and the fund helped expand AED preparedness afterward.
- Use this story only when relevant, with dignity, and as a preparedness/legacy lesson — never as a shock hook or manipulation.`

export const AI_INSURANCE_COMPLIANCE_GUARDRAILS = `Insurance and compliance guardrails:
- Education only; do not present output as legal, tax, investment, or individualized insurance advice.
- Avoid absolute claims such as "tax-free retirement," "never lose money," "no risk," "guaranteed approval," or guaranteed returns.
- Life insurance death benefits are generally income-tax-free; policy loans are generally income-tax-free only when the policy is properly structured and kept in force. Loans and withdrawals can reduce cash value/death benefit and may cause taxes if a policy lapses or becomes a MEC.
- IUL cash value is credited through index formulas, not direct market investment. Mention caps, participation rates, policy charges, lapse risk, and carrier/product terms when discussing growth or downside protection.
- Fixed and fixed-indexed annuities may protect contract value from direct market-index losses, subject to product terms, fees, riders, surrender charges, and the issuing carrier's claims-paying ability. Lifetime income requires elected riders or annuitization and meeting contract conditions.
- Key person life insurance addresses death-risk funding; disability risk requires separate disability coverage or eligible riders.
- Do not cite statistics, current rates, carrier ratings, laws, tax code interpretations, or product features unless supplied in the prompt/context; otherwise say they must be verified with current carrier materials or a qualified advisor.`

export function withAdminAiGuardrails(prompt: string): string {
  return `${prompt.trim()}

${AI_CANONICAL_FOUNDER_STORY}

${AI_INSURANCE_COMPLIANCE_GUARDRAILS}`
}
