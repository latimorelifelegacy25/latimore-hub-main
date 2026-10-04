import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { requireReviewerRole } from '@/lib/rbac'
import { rateLimit } from '@/lib/rate-limit'
import { EmailSendSchema } from '@/lib/schemas'
import { validateResendSandboxRoute } from '@/lib/resend-sandbox'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const auth = await requireReviewerRole()
  if (!auth.ok) return auth.response

  const limited = await rateLimit(req, 'adminSend', auth.email ?? undefined)
  if (limited) return limited

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Missing RESEND_API_KEY inside environment variables.' }, { status: 500 })
  }

  const parsed = EmailSendSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 422 })
  }
  const { to, subject } = parsed.data
  const text = (parsed.data.body ?? parsed.data.text) as string
  const from = process.env.RESEND_FROM_EMAIL ?? process.env.OUTBOUND_FROM_EMAIL ?? 'Latimore Life & Legacy <onboarding@resend.dev>'

  const sandboxCheck = validateResendSandboxRoute({ from, to })
  if (sandboxCheck.ok === false) {
    return NextResponse.json({ error: sandboxCheck.error }, { status: sandboxCheck.status })
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const result = await resend.emails.send({ from, to, subject, text })
    return NextResponse.json({ ok: true, id: result.data?.id ?? null })
  } catch (error) {
    logger.error({ err: error instanceof Error ? error.message : String(error) }, 'Email send failed')
    return NextResponse.json({ error: 'Email could not be sent.' }, { status: 500 })
  }
}
