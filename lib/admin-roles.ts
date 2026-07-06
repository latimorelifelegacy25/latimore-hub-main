export const ADMIN_ROLES = ['ADMIN', 'REVIEWER', 'AGENT'] as const

export type AdminRoleName = (typeof ADMIN_ROLES)[number]

const ADMIN_ROLE_RANK: Record<AdminRoleName, number> = {
  AGENT: 0,
  REVIEWER: 1,
  ADMIN: 2,
}

export function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() || null
}

export function normalizeAdminRole(role?: string | null): AdminRoleName | null {
  if (!role) return null
  const normalized = role.trim().toUpperCase()
  return (ADMIN_ROLES as readonly string[]).includes(normalized)
    ? (normalized as AdminRoleName)
    : null
}

export function hasRequiredAdminRole(
  currentRole: string | null | undefined,
  minimumRole: AdminRoleName = 'AGENT',
) {
  const normalizedCurrentRole = normalizeAdminRole(currentRole)
  if (!normalizedCurrentRole) return false
  return ADMIN_ROLE_RANK[normalizedCurrentRole] >= ADMIN_ROLE_RANK[minimumRole]
}

export function hasAnyAdminRole(role?: string | null) {
  return normalizeAdminRole(role) !== null
}
