import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PrismaClient } from '@prisma/client'

function loadEnvFile(fileName: string) {
  const filePath = resolve(process.cwd(), fileName)
  if (!existsSync(filePath)) return

  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const separator = trimmed.indexOf('=')
    if (separator === -1) continue

    const key = trimmed.slice(0, separator).trim()
    let value = trimmed.slice(separator + 1).trim()

    if ((value.startsWith('"') && value.includes('"', 1)) || (value.startsWith("'") && value.includes("'", 1))) {
      const quote = value[0]
      value = value.slice(1, value.indexOf(quote, 1))
    } else {
      value = value.split('#')[0].trim()
    }

    if (!process.env[key]) process.env[key] = value
  }
}

loadEnvFile('.env.local')
loadEnvFile('.env')

const requiredDatabaseEnv = ['DATABASE_URL', 'DIRECT_URL'] as const
const missingDatabaseEnv = requiredDatabaseEnv.filter((key) => !process.env[key])
const placeholderDatabaseEnv = requiredDatabaseEnv.filter((key) => {
  const value = process.env[key] ?? ''
  return value.includes('USER:PASSWORD') || value.includes('[project-ref]') || value.includes('replace-with')
})

if (missingDatabaseEnv.length || placeholderDatabaseEnv.length) {
  const invalidKeys = [...new Set([...missingDatabaseEnv, ...placeholderDatabaseEnv])]
  console.error(`Cannot seed database until ${invalidKeys.join(', ')} ${invalidKeys.length === 1 ? 'is' : 'are'} set in .env.local.`)
  console.error('Run npm run env:init, fill in real Supabase connection strings, then run npm run db:seed again.')
  process.exit(1)
}

const prisma = new PrismaClient()

async function main() {
  const existing = await prisma.contact.count()
  if (existing > 0) return

  const maria = await prisma.contact.create({
    data: {
      fullName: 'Maria Lopez',
      firstName: 'Maria',
      lastName: 'Lopez',
      email: 'maria@example.com',
      phone: '+15555550101',
      county: 'Miami-Dade',
      primarySource: 'Website',
      primaryMedium: 'Organic',
      leadScore: 85,
      lastActivityAt: new Date(),
    },
  })

  const john = await prisma.contact.create({
    data: {
      fullName: 'John Carter',
      firstName: 'John',
      lastName: 'Carter',
      email: 'john@example.com',
      phone: '+15555550102',
      county: 'Broward',
      primarySource: 'Google Calendar',
      primaryMedium: 'Scheduling',
      leadScore: 62,
      lastActivityAt: new Date(),
    },
  })

  const mariaInquiry = await prisma.inquiry.create({
    data: { contactId: maria.id, stage: 'Qualified', productInterest: 'Term_Life', source: 'Website', medium: 'Organic', county: maria.county, leadScore: 85, notes: 'Requested a life insurance consultation.' },
  })

  const johnInquiry = await prisma.inquiry.create({
    data: { contactId: john.id, stage: 'Booked', productInterest: 'Final_Expense', source: 'Google Calendar', medium: 'Scheduling', county: john.county, leadScore: 62, notes: 'Booked a consultation call.' },
  })

  await prisma.task.createMany({
    data: [
      { contactId: maria.id, inquiryId: mariaInquiry.id, title: 'Send quote follow-up', status: 'Open', dueAt: new Date(Date.now() + 86400000) },
      { contactId: john.id, inquiryId: johnInquiry.id, title: 'Prepare for booked appointment', status: 'Open', dueAt: new Date(Date.now() + 2 * 86400000) },
    ],
  })

  const thread = await prisma.conversationThread.create({
    data: { contactId: john.id, inquiryId: johnInquiry.id, channel: 'sms', lastMessageAt: new Date(), lastInboundAt: new Date() },
  })

  await prisma.conversationMessage.create({
    data: { threadId: thread.id, contactId: john.id, inquiryId: johnInquiry.id, channel: 'sms', direction: 'inbound', status: 'received', bodyText: 'Looking forward to the appointment.', sentAt: new Date() },
  })

  await prisma.note.create({
    data: { contactId: maria.id, inquiryId: mariaInquiry.id, title: 'Initial note', body: 'Prospect interested in term life coverage and wants family protection options.', author: 'System' },
  })

  await prisma.contentAsset.create({
    data: { title: 'Appointment Reminder Email', type: 'email', status: 'draft', campaign: 'Spring Follow-Up', bodyText: 'Just a quick reminder about your upcoming consultation.' },
  })

  await prisma.calendarEvent.create({
    data: { contactId: john.id, inquiryId: johnInquiry.id, provider: 'manual', title: 'Consultation Call', startAt: new Date(Date.now() + 3 * 86400000), status: 'scheduled' },
  })

  await prisma.systemEvent.createMany({
    data: [
      { type: 'seed.contact.created', contactId: maria.id, inquiryId: mariaInquiry.id, payload: { demo: true } },
      { type: 'seed.contact.created', contactId: john.id, inquiryId: johnInquiry.id, payload: { demo: true } },
    ],
  })
}

main().finally(async () => {
  await prisma.$disconnect()
})
