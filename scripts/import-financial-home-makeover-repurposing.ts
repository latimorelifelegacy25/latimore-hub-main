/**
 * One-time import of the platform-adapted repurposing assets (Instagram,
 * X/Twitter, LinkedIn) for the "Financial Home Makeover" blog post into
 * ContentAsset.
 *
 * Idempotent: re-running skips rows that already exist (matched on
 * title + campaign), so it's safe to run multiple times.
 *
 * Usage: npx tsx scripts/import-financial-home-makeover-repurposing.ts
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

type AssetRow = {
  title: string
  type: string
  channel: string
  audience: string
  bodyText: string
  metadata: Record<string, unknown>
}

type RepurposingData = {
  campaign: string
  assets: AssetRow[]
}

function loadData(): RepurposingData {
  const filePath = resolve(process.cwd(), 'prisma/seed-data/financial-home-makeover-repurposing.json')
  return JSON.parse(readFileSync(filePath, 'utf8'))
}

async function main() {
  const data = loadData()
  let created = 0
  let skipped = 0

  for (const row of data.assets) {
    const existing = await prisma.contentAsset.findFirst({
      where: { title: row.title, campaign: data.campaign },
    })
    if (existing) {
      skipped++
      continue
    }

    await prisma.contentAsset.create({
      data: {
        title: row.title,
        type: row.type as 'social_post',
        status: 'draft',
        channel: row.channel,
        audience: row.audience,
        campaign: data.campaign,
        bodyText: row.bodyText,
        metadata: row.metadata as Prisma.InputJsonValue,
      },
    })
    created++
  }

  console.log('Financial Home Makeover repurposing assets:', { created, skipped })
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
