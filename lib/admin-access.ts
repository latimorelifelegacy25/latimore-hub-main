import { prisma } from '@/lib/prisma'
import { normalizeEmail, type AdminRoleName } from '@/lib/admin-roles'

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

export { ADMIN_ROLES, type AdminRoleName } from '@/lib/admin-roles'

export async function getAdminRoleForEmail(email?: string | null): Promise<AdminRoleName | null> {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail) return null

  try {
    const adminUser = await prisma.adminUser.findUnique({
      where: { email: normalizedEmail },
      select: { role: true, active: true },
    })

    if (adminUser) {
      return adminUser.active ? adminUser.role : null
    }
  } catch (error) {
    // The AdminUser lookup must not lock every operator out of the admin when
    // the database is unreachable or the RBAC migration hasn't been applied
    // yet — fall through to the ADMIN_EMAILS allowlist below.
    console.error('[admin-access] AdminUser lookup failed; falling back to ADMIN_EMAILS allowlist.', error)
  }

  // Temporary bridge: existing ADMIN_EMAILS operators retain ADMIN while the
  // AdminUser table is backfilled, but route guards can now enforce roles.
  return isAdminEmail(normalizedEmail) ? 'ADMIN' : null
}
