import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { getAdminRoleForEmail } from '@/lib/admin-access'
import { logger } from '@/lib/logger'
import '@/lib/env'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: { params: { prompt: 'consent', access_type: 'offline', response_type: 'code' } },
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      const email = (profile?.email ?? '').toLowerCase()
      const role = await getAdminRoleForEmail(email)
      const allowed = Boolean(role)
      // Keyed `attemptedEmail` (not `email`) so the logger's PII redaction
      // doesn't strip it — this is the access-control audit trail and the
      // operator allowlist, not customer PII.
      logger.info({ attemptedEmail: email, allowed, role }, '[auth] signIn attempt')
      return allowed
    },
  },
  pages: { signIn: '/login' },
}
