import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // Log admin access attempts in production
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
