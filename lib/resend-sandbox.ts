const RESEND_SANDBOX_DOMAIN = 'onboarding@resend.dev'

function extractEmail(value: string): string {
  const match = value.match(/<([^>]+)>/)
  return (match?.[1] ?? value).trim().toLowerCase()
}

function normalizeRecipients(to: string | string[]): string[] {
  return (Array.isArray(to) ? to : [to])
    .flatMap((item) => String(item).split(','))
    .map(extractEmail)
    .filter(Boolean)
}

export function validateResendSandboxRoute({
  from,
  to,
  verifiedEmail = process.env.RESEND_SANDBOX_VERIFIED_EMAIL ?? process.env.RESEND_VERIFIED_EMAIL,
}: {
  from: string
  to: string | string[]
  verifiedEmail?: string
}): { ok: true } | { ok: false; status: 403; error: string } {
  if (!extractEmail(from).includes(RESEND_SANDBOX_DOMAIN)) return { ok: true }

  const recipients = normalizeRecipients(to)
  const verified = verifiedEmail ? extractEmail(verifiedEmail) : ''

  if (!verified) {
    return {
      ok: false,
      status: 403,
      error:
        'Resend sandbox mode is active because the sender uses onboarding@resend.dev. Set RESEND_SANDBOX_VERIFIED_EMAIL to the single verified test inbox or configure a verified sending domain.',
    }
  }

  const blocked = recipients.filter((recipient) => recipient !== verified)
  if (blocked.length > 0) {
    return {
      ok: false,
      status: 403,
      error:
        'Resend sandbox mode limits outbound email to the verified test inbox. Configure a verified Resend domain before emailing live leads.',
    }
  }

  return { ok: true }
}
