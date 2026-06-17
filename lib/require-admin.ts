import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'

export async function requireAdmin(req: NextRequest, bucket = 'default') {
  const limited = await rateLimit(req, bucket)
  if (limited) return limited

  if (process.env.DISABLE_ADMIN_AUTH === 'true') {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ ok: false, error: 'Admin auth disabled in production.' }, { status: 403 })
    }

    return null
  }

  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  return null
}
