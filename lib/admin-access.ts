export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean)
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false
  const allowedEmails = getAdminEmails()

  if (allowedEmails.length === 0) {
    return false
  }

  return allowedEmails.includes(email.trim().toLowerCase())
}
