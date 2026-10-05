import { Resend } from 'resend'
import { captureException } from '@/lib/error-tracking'
import { validateResendSandboxRoute } from '@/lib/resend-sandbox'

let resendClient: Resend | null = null
let resendClientKey: string | null = null

function getResend(apiKey: string) {
  if (!resendClient || resendClientKey !== apiKey) {
    resendClient = new Resend(apiKey)
    resendClientKey = apiKey
  }
  return resendClient
}

export async function sendMail({
  to,
  from,
  subject,
  html,
  attachments,
}: {
  to: string | string[]
  from: string
  subject: string
  html: string
  attachments?: { filename: string; content: Buffer | string }[]
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set — skipping email')
    return { ok: false, error: 'missing RESEND_API_KEY' }
  }

  const sandboxCheck = validateResendSandboxRoute({ from, to })
  if (sandboxCheck.ok === false) {
    console.warn(sandboxCheck.error)
    return { ok: false, error: sandboxCheck.error }
  }

  try {
    const resend = getResend(process.env.RESEND_API_KEY)
    const r = await resend.emails.send({ to, from, subject, html, ...(attachments?.length ? { attachments } : {}) })
    if (r.error || !r.data?.id) {
      return { ok: false, error: r.error?.message ?? 'Email provider did not return a message id' }
    }
    return { ok: true, id: r.data.id }
  } catch (err: any) {
    await captureException(err, { source: 'notification', channel: 'email', to: Array.isArray(to) ? to.join(',') : to })
    return { ok: false, error: err?.message ?? 'unknown' }
  }
}
