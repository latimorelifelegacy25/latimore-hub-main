import { randomUUID } from 'node:crypto'
import { prisma } from '@/lib/prisma'
import { isAllowedDestination } from './links'

/** Create a distinct click counter for a GBP post before submitting it. */
export async function createGbpTrackingLink(
  destination: string,
  options: { origin?: string; postId?: string; createdBy?: string | null } = {},
): Promise<string> {
  if (!isAllowedDestination(destination)) {
    throw new Error('Article URL is not an allowed tracking destination.')
  }
  const origin = new URL(options.origin || process.env.NEXT_PUBLIC_BASE_URL || 'https://hub.latimorelifelegacy.com').origin
  const slug = `gbp-${randomUUID().replaceAll('-', '').slice(0, 24)}`
  await prisma.trackingLink.create({
    data: {
      slug,
      destination,
      label: 'Google Business Profile article',
      utmSource: 'gbp',
      utmMedium: 'social',
      utmCampaign: 'gbp-articles',
      utmContent: options.postId || slug,
      createdBy: options.createdBy,
    },
  })
  return `${origin}/t/${slug}`
}
