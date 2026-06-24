import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { requireAdminSession } from '@/lib/ai/shared'
import { validateResendSandboxRoute } from '@/lib/resend-sandbox'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Missing RESEND_API_KEY inside environment variables.' }, { status: 500 })
  }

  const body = await req.json().catch(() => null)
  const to = String(body?.to ?? '').trim()
  const subject = String(body?.subject ?? '').trim()
  const text = String(body?.body ?? body?.text ?? '').trim()
  const from = process.env.RESEND_FROM_EMAIL ?? process.env.OUTBOUND_FROM_EMAIL ?? 'Latimore Life & Legacy <onboarding@resend.dev>'

  if (!EMAIL_RE.test(to)) {
    return NextResponse.json({ error: 'A valid recipient email address is required.' }, { status: 400 })
  }
  if (!subject || !text) {
    return NextResponse.json({ error: 'Subject line and email body content are required.' }, { status: 400 })
  }

  const sandboxCheck = validateResendSandboxRoute({ from, to })
  if (sandboxCheck.ok === false) {
    return NextResponse.json({ error: sandboxCheck.error }, { status: sandboxCheck.status })
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const result = await resend.emails.send({ from, to, subject, text })
    return NextResponse.json({ ok: true, id: result.data?.id ?? null })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Email service router crash exception.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
