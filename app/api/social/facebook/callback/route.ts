import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { prisma } from '@/lib/prisma'
import { encryptToken } from '@/lib/crypto'
import { requireAdminSession } from '@/lib/ai/shared'

export const dynamic = 'force-dynamic'

function redirectAndClearState(url: URL) {
  const response = NextResponse.redirect(url)
  response.cookies.set('fb_oauth_state', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return response
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminSession()
  if (!auth.ok) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const cookieState = req.cookies.get('fb_oauth_state')?.value

  const stateBuf = Buffer.from(state ?? '')
  const cookieBuf = Buffer.from(cookieState ?? '')
  const stateValid =
    state &&
    cookieState &&
    stateBuf.length === cookieBuf.length &&
    timingSafeEqual(stateBuf, cookieBuf)

  if (!stateValid) {
    return redirectAndClearState(
      new URL('/admin/social?fb_error=invalid_state', req.url)
    )
  }

  if (!code) {
    return redirectAndClearState(new URL('/admin/social?fb_error=no_code', req.url))
  }

  try {
    // Exchange code for short-lived token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${process.env.FACEBOOK_CLIENT_ID}&redirect_uri=${process.env.FACEBOOK_REDIRECT_URI}&client_secret=${process.env.FACEBOOK_CLIENT_SECRET}&code=${code}`
    )
    const tokenData = await tokenRes.json()

    if (!tokenRes.ok || !tokenData.access_token) {
      return redirectAndClearState(
        new URL('/admin/social?fb_error=token_exchange_failed', req.url)
      )
    }

    // Exchange for long-lived token
    const longRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.FACEBOOK_CLIENT_ID}&client_secret=${process.env.FACEBOOK_CLIENT_SECRET}&fb_exchange_token=${tokenData.access_token}`
    )
    const longData = await longRes.json()

    const userToken = longData.access_token
    if (!longRes.ok || !userToken) {
      return redirectAndClearState(
        new URL('/admin/social?fb_error=token_exchange_failed', req.url)
      )
    }

    // Fetch pages
    const pagesRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${userToken}`
    )
    const pages = await pagesRes.json()

    if (!pages.data?.length) {
      return redirectAndClearState(new URL('/admin/social?fb_error=no_pages', req.url))
    }

    const page = pages.data[0]

    // Save Facebook connection
    const existingFacebook = await prisma.socialConnection.findFirst({ where: { provider: 'facebook' } })
    const facebookData = {
      accountName: page.name,
      externalId: page.id,
      accessToken: encryptToken(page.access_token),
      status: 'connected',
    }
    if (existingFacebook) {
      await prisma.socialConnection.update({ where: { id: existingFacebook.id }, data: facebookData })
    } else {
      await prisma.socialConnection.create({ data: { provider: 'facebook', ...facebookData } })
    }

    // Also save the linked Instagram business account if present
    const igRes = await fetch(
      `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
    )
    const igData = await igRes.json()
    const instagramBusinessId = igData.instagram_business_account?.id

    if (instagramBusinessId) {
      const existingInstagram = await prisma.socialConnection.findFirst({ where: { provider: 'instagram' } })
      const instagramData = {
        accountName: page.name,
        externalId: instagramBusinessId,
        accessToken: encryptToken(page.access_token),
        status: 'connected',
      }
      if (existingInstagram) {
        await prisma.socialConnection.update({ where: { id: existingInstagram.id }, data: instagramData })
      } else {
        await prisma.socialConnection.create({ data: { provider: 'instagram', ...instagramData } })
      }
    }

    return redirectAndClearState(new URL('/admin/social?fb_success=1', req.url))
  } catch {
    return redirectAndClearState(
      new URL('/admin/social?fb_error=connect_failed', req.url)
    )
  }
}
