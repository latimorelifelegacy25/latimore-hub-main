import { Resend } from 'resend'
import { captureException } from '@/lib/error-tracking'

export async function sendMail({
  to,
  from,
  subject,
  html,
}: {
  to: string | string[]
  from: string
  subject: string
  html: string
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set — skipping email')
    return { ok: false, error: 'missing RESEND_API_KEY' }
  }
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const r = await resend.emails.send({ to, from, subject, html })
    return { ok: true, id: r.data?.id }
  } catch (err: any) {
    await captureException(err, { source: 'notification', channel: 'email', to: Array.isArray(to) ? to.join(',') : to })
    return { ok: false, error: err?.message ?? 'unknown' }
  }
}
