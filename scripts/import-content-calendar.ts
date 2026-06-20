/**
 * One-time import of the "Latimore Life & Legacy 12-Month Master Content
 * Calendar" (April 2026 - March 2027) into SocialTemplate / ContentAsset.
 *
 * Idempotent: re-running skips rows that already exist (matched on
 * title + campaign), so it's safe to run multiple times.
 *
 * Usage: npx tsx scripts/import-content-calendar.ts
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type SocialTemplateRow = {
  month: string
  campaign: string
  number: string
  category: string
  title: string
  body: string
  cta: string
  hashtags: string[]
}

type EmailRow = {
  month: string
  campaign: string
  title: string
  subjectOptions: string[]
  body: string
}

type ScriptRow = {
  month: string
  campaign: string
  label: string
  body: string
}

type CalendarData = {
  socialTemplates: SocialTemplateRow[]
  emails: EmailRow[]
  scripts: ScriptRow[]
}

function loadData(): CalendarData {
  const filePath = resolve(process.cwd(), 'prisma/seed-data/content-calendar-2026-27.json')
  return JSON.parse(readFileSync(filePath, 'utf8'))
}

async function importSocialTemplates(rows: SocialTemplateRow[]) {
  let created = 0
  let skipped = 0

  for (const row of rows) {
    if (!row.title || !row.body) {
      skipped++
      continue
    }

    const existing = await prisma.socialTemplate.findFirst({
      where: { title: row.title, campaign: row.campaign },
    })
    if (existing) {
      skipped++
      continue
    }

    await prisma.socialTemplate.create({
      data: {
        title: row.title,
        category: row.category || 'GENERAL',
        body: row.body,
        cta: row.cta || null,
        hashtags: row.hashtags,
        campaign: row.campaign,
        complianceStatus: 'draft',
      },
    })
    created++
  }

  return { created, skipped }
}

async function importEmails(rows: EmailRow[]) {
  let created = 0
  let skipped = 0

  for (const row of rows) {
    if (!row.title || !row.body) {
      skipped++
      continue
    }

    const existing = await prisma.contentAsset.findFirst({
      where: { title: row.title, campaign: row.campaign },
    })
    if (existing) {
      skipped++
      continue
    }

    await prisma.contentAsset.create({
      data: {
        title: row.title,
        type: 'email',
        status: 'draft',
        campaign: row.campaign,
        bodyText: row.body,
        metadata: { kind: 'newsletter', subjectOptions: row.subjectOptions, sourceMonth: row.month },
      },
    })
    created++
  }

  return { created, skipped }
}

async function importScripts(rows: ScriptRow[]) {
  let created = 0
  let skipped = 0

  for (const row of rows) {
    if (!row.label || !row.body || row.body.trim().length === 0) {
      skipped++
      continue
    }

    const existing = await prisma.contentAsset.findFirst({
      where: { title: row.label, campaign: row.campaign },
    })
    if (existing) {
      skipped++
      continue
    }

    await prisma.contentAsset.create({
      data: {
        title: row.label,
        type: 'blog',
        status: 'draft',
        campaign: row.campaign,
        bodyText: row.body,
        metadata: { kind: 'script', sourceMonth: row.month },
      },
    })
    created++
  }

  return { created, skipped }
}

async function main() {
  const data = loadData()

  const socialResult = await importSocialTemplates(data.socialTemplates)
  const emailResult = await importEmails(data.emails)
  const scriptResult = await importScripts(data.scripts)

  console.log('Social templates:', socialResult)
  console.log('Email newsletters:', emailResult)
  console.log('Scripts:', scriptResult)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
