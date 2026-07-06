import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { getAdminRoleForEmail } from '@/lib/admin-access'
import { normalizeAdminRole } from '@/lib/admin-roles'
import { logger } from '@/lib/logger'
import '@/lib/env'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: { params: { prompt: 'consent', access_type: 'offline', response_type: 'code' } },
    }),
  ],
  callbacks: {
    async signIn({ user, profile }) {
      const email = (profile?.email ?? user?.email ?? '').toLowerCase()
      const role = await getAdminRoleForEmail(email)
      const allowed = Boolean(role)
      // Keyed `attemptedEmail` (not `email`) so the logger's PII redaction
      // doesn't strip it — this is the access-control audit trail and the
      // operator allowlist, not customer PII.
      logger.info({ attemptedEmail: email, allowed, role }, '[auth] signIn attempt')
      return allowed
    },
    async jwt({ token, user, profile }) {
      const email = (typeof token.email === 'string' ? token.email : profile?.email ?? user?.email ?? '').toLowerCase()

      if (!email) {
        delete token.role
        return token
      }

      token.email = email

      if (user || profile || !normalizeAdminRole(token.role ?? null)) {
        const role = await getAdminRoleForEmail(email)
        if (role) token.role = role
        else delete token.role
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        if (typeof token.email === 'string') session.user.email = token.email

        const role = normalizeAdminRole(token.role ?? null)
        if (role) session.user.role = role
        else delete session.user.role
      }

      return session
    },
  },
  pages: { signIn: '/login' },
}
