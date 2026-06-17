import { getToken } from 'next-auth/jwt'
import { NextResponse, type NextRequest } from 'next/server'
import { isAdminEmail } from '@/lib/admin-access'

// Set DISABLE_ADMIN_AUTH=true in .env.local for local/debug access without Google OAuth.
// Never set this true in production.
const DISABLE_AUTH = process.env.DISABLE_ADMIN_AUTH === 'true'

const protectedPrefixes = [
  '/admin',
  '/dashboard',
  '/crm',
  '/leads',
  '/api/admin',
  '/api/ai',
  '/api/analytics/ga4/data',
  '/api/analytics/v1',
  '/api/calendar/book',
  '/api/calendar/google',
  '/api/contacts',
  '/api/content',
  '/api/dashboard',
  '/api/documents',
  '/api/hub-os',
  '/api/inquiries',
  '/api/marketing',
  '/api/messages',
  '/api/reports',
  '/api/social/facebook/insights',
  '/api/social/facebook/publish',
  '/api/social/facebook/validate',
  '/api/social/manual-test',
  '/api/social/metrics',
  '/api/social/posts',
  '/api/social/templates',
  '/api/social/upload',
  '/api/tasks',
]

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

function isApiPath(pathname: string) {
  return pathname.startsWith('/api/')
}

function withPrivateHeaders(response: NextResponse) {
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
  response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Referrer-Policy', 'no-referrer')
  response.headers.set('X-Frame-Options', 'DENY')
  return response
}

function notFound() {
  return withPrivateHeaders(new NextResponse('Not Found', { status: 404 }))
}

function unauthorizedJson(status: 401 | 403, message: string) {
  return withPrivateHeaders(NextResponse.json({ error: message }, { status }))
}

function redirectToSignIn(req: NextRequest) {
  const signInUrl = new URL('/api/auth/signin', req.url)
  signInUrl.searchParams.set('callbackUrl', req.nextUrl.pathname)
  return withPrivateHeaders(NextResponse.redirect(signInUrl))
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (!isProtectedPath(pathname)) {
    return NextResponse.next()
  }

  if (DISABLE_AUTH) {
    if (process.env.NODE_ENV === 'production') {
      return isApiPath(pathname)
        ? unauthorizedJson(403, 'Admin auth disabled in production.')
        : notFound()
    }

    return withPrivateHeaders(NextResponse.next())
  }

  if (!process.env.NEXTAUTH_SECRET) {
    return isApiPath(pathname)
      ? unauthorizedJson(401, 'Admin authentication is not configured.')
      : notFound()
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const email = typeof token?.email === 'string' ? token.email : null

  if (!token || !email) {
    return isApiPath(pathname)
      ? unauthorizedJson(401, 'Authentication required.')
      : redirectToSignIn(req)
  }

  if (!isAdminEmail(email)) {
    return isApiPath(pathname)
      ? unauthorizedJson(403, 'Forbidden.')
      : notFound()
  }

  return withPrivateHeaders(NextResponse.next())
}

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/dashboard',
    '/dashboard/:path*',
    '/crm',
    '/crm/:path*',
    '/leads',
    '/leads/:path*',
    '/api/admin/:path*',
    '/api/ai/:path*',
    '/api/analytics/ga4/data',
    '/api/analytics/v1/:path*',
    '/api/calendar/book',
    '/api/calendar/google/:path*',
    '/api/contacts/:path*',
    '/api/content/:path*',
    '/api/dashboard/:path*',
    '/api/documents/:path*',
    '/api/hub-os/:path*',
    '/api/inquiries/:path*',
    '/api/marketing/:path*',
    '/api/messages/:path*',
    '/api/reports/:path*',
    '/api/social/facebook/insights',
    '/api/social/facebook/publish',
    '/api/social/facebook/validate',
    '/api/social/manual-test',
    '/api/social/metrics',
    '/api/social/posts/:path*',
    '/api/social/templates/:path*',
    '/api/social/upload',
    '/api/tasks/:path*',
  ],
}
