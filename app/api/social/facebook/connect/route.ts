import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { requireAdminSession } from '@/lib/ai/shared'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  const redirect = encodeURIComponent(process.env.FACEBOOK_REDIRECT_URI!)
  const clientId = process.env.FACEBOOK_CLIENT_ID!
  const state = crypto.randomBytes(32).toString('hex')

  const response = NextResponse.redirect(
    `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirect}&scope=pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish&state=${state}`
  )

  response.cookies.set('fb_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 10 * 60,
  })

  return response
}
