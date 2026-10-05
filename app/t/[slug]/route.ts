import { createHash } from 'node:crypto'
import { after, NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { buildDestination, isAllowedDestination, resolveLink } from '@/lib/tracking/links'
import { getExcludedTrafficReason } from '@/lib/tracking/internal-traffic'

export const dynamic = 'force-dynamic'

function home(req: NextRequest) {
  return NextResponse.redirect(new URL('/', req.url), 302)
}

function hashIp(ip: string) {
  const salt = process.env.TRACKING_HASH_SALT || process.env.NEXTAUTH_SECRET || ''
  return createHash('sha256').update(`${ip}${salt}`).digest('hex')
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const limited = await rateLimit(req, 'ethos_redirect')
    if (limited) return limited
  } catch (error) {
    console.error('[tracking-link] rate limit check failed; continuing', error)
  }

  const { slug } = await params

  let link
  try {
    link = await resolveLink(slug)
  } catch (error) {
    console.error('[tracking-link] lookup failed', error)
    return home(req)
  }
  if (!link || !isAllowedDestination(link.destination)) return home(req)

  let target: string
  try {
    target = buildDestination(link)
  } catch {
    return home(req)
  }

  // Best-effort click log; never blocks or fails the redirect.
  if (!getExcludedTrafficReason(req)) {
    const linkId = link.id
    const linkSlug = link.slug
    const referrer = req.headers.get('referer')?.slice(0, 500) || null
    const userAgent = req.headers.get('user-agent')?.slice(0, 300) || null
    const ipHash = hashIp(getClientIp(req))
    after(async () => {
      try {
        await prisma.trackingClick.create({
          data: { linkId, slug: linkSlug, referrer, userAgent, ipHash },
        })
      } catch (error) {
        console.error('[tracking-link] click log failed', error)
      }
    })
  }

  const response = NextResponse.redirect(new URL(target, req.url), 302)
  response.headers.set('Cache-Control', 'no-store')
  return response
}
