import { withAuth } from 'next-auth/middleware'
import { NextResponse, type NextRequest } from 'next/server'

// Set DISABLE_ADMIN_AUTH=true in .env.local for local/debug access without Google OAuth.
// Never set this true in production.
const DISABLE_AUTH = process.env.DISABLE_ADMIN_AUTH === 'true'

export default DISABLE_AUTH
  ? function bypass(_req: NextRequest) { return NextResponse.next() } // eslint-disable-line @typescript-eslint/no-unused-vars
  : withAuth(
      function middleware(req) {
        if (req.nextUrl.pathname.startsWith('/admin')) {
          const token = req.nextauth.token
          if (!token) {
            return NextResponse.redirect(new URL('/api/auth/signin', req.url))
          }
        }
        return NextResponse.next()
      },
      {
        callbacks: {
          authorized: ({ token, req }) => {
            if (req.nextUrl.pathname.startsWith('/admin')) {
              return !!token
            }
            return true
          },
        },
      }
    )

export const config = {
  matcher: ['/admin/:path*'],
}
