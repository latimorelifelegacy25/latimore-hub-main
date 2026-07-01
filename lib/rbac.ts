import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { getAdminRoleForEmail, type AdminRoleName } from '@/lib/admin-access'

export type { AdminRoleName } from '@/lib/admin-access'

export type AdminAuthContext = {
  ok: true
  session: Awaited<ReturnType<typeof getServerSession>> | null
  email: string | null
  role: AdminRoleName | 'DISABLED_AUTH'
}

export type AdminAuthFailure = {
  ok: false
  response: NextResponse
}

function forbiddenInProduction() {
  return NextResponse.json(
    { ok: false, error: 'DISABLE_ADMIN_AUTH=true is forbidden when NODE_ENV=production' },
    { status: 403 },
  )
}

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() || null
}

export async function requireRole(allowedRoles: readonly AdminRoleName[]): Promise<AdminAuthContext | AdminAuthFailure> {
  if (process.env.DISABLE_ADMIN_AUTH === 'true') {
    if (process.env.NODE_ENV === 'production') {
      return { ok: false, response: forbiddenInProduction() }
    }

    return { ok: true, session: null, email: null, role: 'DISABLED_AUTH' }
  }

  const session = await getServerSession(authOptions)
  const email = normalizeEmail(session?.user?.email)

  if (!session || !email) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 }),
    }
  }

  const role = await getAdminRoleForEmail(email)
  if (!role || !allowedRoles.includes(role)) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 }),
    }
  }

  return { ok: true, session, email, role }
}

export const requireAdminRole = () => requireRole(['ADMIN'])
export const requireReviewerRole = () => requireRole(['ADMIN', 'REVIEWER'])
export const requireAgentRole = () => requireRole(['ADMIN', 'REVIEWER', 'AGENT'])
