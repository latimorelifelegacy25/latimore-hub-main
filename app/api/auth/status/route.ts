export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { isAdminEmail } from '@/lib/admin-access'
import { prisma } from '@/lib/prisma'

const SOCIAL_PROVIDERS = ['facebook', 'instagram', 'twitter', 'linkedin'] as const

type Provider = typeof SOCIAL_PROVIDERS[number]

function emptyStatus(): Record<Provider, boolean> {
  return {
    facebook: false,
    instagram: false,
    twitter: false,
    linkedin: false,
  }
}

export async function GET() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email ?? null
  const admin = isAdminEmail(email)
  const providers = emptyStatus()

  if (admin) {
    const socialConnectionModel = (prisma as any).socialConnection

    if (socialConnectionModel) {
      const connections = await socialConnectionModel.findMany({
        where: {
          provider: { in: [...SOCIAL_PROVIDERS] },
        },
        select: {
          provider: true,
          status: true,
          accessToken: true,
          refreshToken: true,
        },
      })

      for (const connection of connections) {
        const provider = String(connection.provider) as Provider
        if (provider in providers) {
          providers[provider] = connection.status !== 'disconnected' && Boolean(connection.accessToken || connection.refreshToken)
        }
      }
    }
  }

  return NextResponse.json({
    ok: true,
    authenticated: Boolean(session),
    admin,
    email,
    ...providers,
    providers,
  })
}
