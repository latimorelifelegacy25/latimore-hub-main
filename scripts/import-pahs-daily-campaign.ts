/**
 * One-time import of the "PAHS Daily Social Media Campaign" playbook
 * (July 19 - November 30, 2026, 135 days) into SocialPost.
 *
 * Creates one SocialPost per day per platform (Facebook first, plus the
 * Instagram/LinkedIn mirrors called for by the playbook), with scheduledAt
 * pre-computed per the campaign's posting windows:
 *   - Mon-Fri: Facebook 8:30 AM Eastern
 *   - Sat-Sun: Facebook 10:00 AM Eastern
 *   - Instagram mirror +15 min, LinkedIn mirror +30 min
 *
 * Posts are created with status "draft" so nothing auto-publishes — the
 * social-publisher cron only picks up status "scheduled". Approve posts in
 * Social OS (flip to "scheduled") to arm them.
 *
 * Idempotent: re-running skips rows that already exist (matched on
 * campaign + platform + campaign day in metadata).
 *
 * Usage: npx tsx scripts/import-pahs-daily-campaign.ts
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type CampaignPost = {
  day: number
  date: string
  dayOfWeek: string
  special: string | null
  pillar: string
  platforms: string[]
  body: string
  hashtags: string[]
  cta: string | null
}

type CampaignData = {
  campaign: string
  name: string
  tagline: string
  startDate: string
  endDate: string
  totalDays: number
  leadUrl: string
  posts: CampaignPost[]
}

function loadData(): CampaignData {
  const filePath = resolve(process.cwd(), 'prisma/seed-data/pahs-daily-campaign-2026.json')
  return JSON.parse(readFileSync(filePath, 'utf8'))
}

/**
 * Eastern-time offset for the campaign window: EDT (UTC-4) through
 * October 31, 2026; EST (UTC-5) from November 1, 2026 (DST ends Nov 1).
 */
function easternOffsetHours(isoDate: string): number {
  return isoDate >= '2026-11-01' ? 5 : 4
}

function scheduledAtFor(post: CampaignPost, platformIndex: number): Date {
  const isWeekend = post.dayOfWeek === 'Saturday' || post.dayOfWeek === 'Sunday'
  const easternHour = isWeekend ? 10 : 8
  const easternMinute = isWeekend ? 0 : 30
  const utcHour = easternHour + easternOffsetHours(post.date)
  const base = new Date(
    `${post.date}T${String(utcHour).padStart(2, '0')}:${String(easternMinute).padStart(2, '0')}:00.000Z`,
  )
  return new Date(base.getTime() + platformIndex * 15 * 60_000)
}

function buildCaption(post: CampaignPost): string {
  const parts = [post.body]
  if (post.cta) parts.push(post.cta)
  if (post.hashtags.length > 0) parts.push(post.hashtags.join(' '))
  return parts.join('\n\n')
}

async function importPosts(data: CampaignData) {
  let created = 0
  let skipped = 0

  for (const post of data.posts) {
    for (const [platformIndex, platform] of post.platforms.entries()) {
      const existing = await prisma.socialPost.findFirst({
        where: {
          campaign: data.campaign,
          platform,
          metadata: { path: ['campaignDay'], equals: post.day },
        },
      })
      if (existing) {
        skipped++
        continue
      }

      await prisma.socialPost.create({
        data: {
          platform,
          status: 'draft',
          caption: buildCaption(post),
          scheduledAt: scheduledAtFor(post, platformIndex),
          campaign: data.campaign,
          metadata: {
            campaignDay: post.day,
            date: post.date,
            dayOfWeek: post.dayOfWeek,
            pillar: post.pillar,
            special: post.special,
            source: 'pahs-daily-campaign-2026',
          },
        },
      })
      created++
    }
  }

  return { created, skipped }
}

async function main() {
  const data = loadData()
  if (data.posts.length !== data.totalDays) {
    throw new Error(`Expected ${data.totalDays} posts, found ${data.posts.length}`)
  }

  const result = await importPosts(data)
  console.log(`Campaign "${data.campaign}" (${data.startDate} → ${data.endDate}):`, result)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
