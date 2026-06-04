import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')

  // Exchange code for short-lived token
  const tokenRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${process.env.FACEBOOK_CLIENT_ID}&redirect_uri=${process.env.FACEBOOK_REDIRECT_URI}&client_secret=${process.env.FACEBOOK_CLIENT_SECRET}&code=${code}`
  )
  const tokenData = await tokenRes.json()

  // Exchange for long-lived token
  const longRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.FACEBOOK_CLIENT_ID}&client_secret=${process.env.FACEBOOK_CLIENT_SECRET}&fb_exchange_token=${tokenData.access_token}`
  )
  const longData = await longRes.json()

  const userToken = longData.access_token

  // Fetch pages
  const pagesRes = await fetch(
    `https://graph.facebook.com/v19.0/me/accounts?access_token=${userToken}`
  )
  const pages = await pagesRes.json()

  if (!pages.data?.length) {
    return NextResponse.redirect('/admin/social?fb_error=no_pages')
  }

  const page = pages.data[0]

  // Save Facebook connection
  await prisma.socialConnection.upsert({
    where: { provider: 'facebook' },
    update: {
      accountName: page.name,
      externalId: page.id,
      accessToken: page.access_token,
      status: 'connected',
    },
    create: {
      provider: 'facebook',
      accountName: page.name,
      externalId: page.id,
      accessToken: page.access_token,
      status: 'connected',
    },
  })

  return NextResponse.redirect('/admin/social?fb_success=1')
}
