import { NextRequest } from 'next/server'
import { requireAdminRole } from '@/lib/rbac'
import { rateLimit } from '@/lib/rate-limit'

export async function requireAdmin(req: NextRequest, bucket = 'default') {
  const limited = await rateLimit(req, bucket)
  if (limited) return limited

  const auth = await requireAdminRole()
  return auth.ok ? null : auth.response
}
