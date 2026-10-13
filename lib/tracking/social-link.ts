import { randomUUID } from 'node:crypto'
import { prisma } from '@/lib/prisma'
import { isAllowedDestination } from './links'

export type SocialPlatform = 'gbp' | 'facebook' | 'instagram' | 'linkedin'

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  gbp: 'Google Business Profile',
  facebook: 'Facebook',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
}

const PUBLIC_ORIGIN = 'https://www.latimorelifelegacy.com'

/**
 * Tracked links are shared with the public, so they must live on the public
 * host. The hub host is the private admin surface; building links there made
 * public clicks look like staff traffic.
 */
function publicOrigin(): string {
  try {
    return new URL(process.env.TRACKING_PUBLIC_ORIGIN || PUBLIC_ORIGIN).origin
  } catch {
    return PUBLIC_ORIGIN
  }
}

/** Point at the canonical article URL: www host and /blog (not legacy /education/blog). */
export function canonicalizeDestination(destination: string): string {
  const value = destination.trim()
  if (value.startsWith('/')) return value.replace(/^\/education\/blog(?=\/|$|\?|#)/, '/blog')
  try {
    const url = new URL(value)
    if (['latimorelifelegacy.com', 'www.latimorelifelegacy.com'].includes(url.hostname.toLowerCase())) {
      url.protocol = 'https:'
      url.hostname = 'www.latimorelifelegacy.com'
      url.pathname = url.pathname.replace(/^\/education\/blog(?=\/|$)/, '/blog')
      return url.toString()
    }
  } catch {
    // Fall through; isAllowedDestination rejects anything unparseable.
  }
  return value
}

/** Create a distinct click counter for one post on one platform before submitting it. */
export async function createSocialTrackingLink(
  platform: SocialPlatform,
  destination: string,
  options: { postId?: string; campaign?: string; createdBy?: string | null } = {},
): Promise<string> {
  const canonical = canonicalizeDestination(destination)
  if (!isAllowedDestination(canonical)) {
    throw new Error('Article URL is not an allowed tracking destination.')
  }
  const slug = `${platform}-${randomUUID().replaceAll('-', '').slice(0, 24)}`
  await prisma.trackingLink.create({
    data: {
      slug,
      destination: canonical,
      label: `${PLATFORM_LABELS[platform]} post`,
      utmSource: platform,
      utmMedium: 'social',
      utmCampaign: (options.campaign || `${platform}-articles`).toLowerCase(),
      utmContent: options.postId || slug,
      createdBy: options.createdBy,
    },
  })
  return `${publicOrigin()}/t/${slug}`
}

/** Create a distinct click counter for a GBP post before submitting it. */
export function createGbpTrackingLink(
  destination: string,
  options: { postId?: string; createdBy?: string | null } = {},
): Promise<string> {
  return createSocialTrackingLink('gbp', destination, options)
}
