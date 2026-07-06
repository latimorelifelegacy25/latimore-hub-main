import type { DefaultSession } from 'next-auth'
import type { AdminRoleName } from '@/lib/admin-roles'

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      role?: AdminRoleName
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: AdminRoleName
  }
}
