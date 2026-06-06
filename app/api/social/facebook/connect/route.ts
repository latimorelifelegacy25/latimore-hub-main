import { NextResponse } from 'next/server'

export async function GET() {
  const redirect = encodeURIComponent(process.env.FACEBOOK_REDIRECT_URI!)
  const clientId = process.env.FACEBOOK_CLIENT_ID!

  return NextResponse.redirect(
    `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirect}&scope=pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish`
  )
}
