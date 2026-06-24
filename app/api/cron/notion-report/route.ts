import { NextRequest, NextResponse } from 'next/server'
import { callNotionWorker } from '@/lib/notion-worker'
import { requireCronAuth } from '@/lib/ai/shared'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const unauthorized = requireCronAuth(req)
  if (unauthorized) return unauthorized

  const now = new Date()
  const day = now.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'America/New_York' })
  const title = `Latimore OS — ${day} Operating Report`

  const data = await callNotionWorker({
    action: 'create_page',
    title,
    sections: [
      {
        heading: 'Executive Summary',
        body: 'Automated Latimore OS operating report. Review CRM, marketing, compliance, deployment, and worker health.',
      },
      {
        heading: 'CRM Worker Focus',
        items: [
          'Scan stale pipeline stages.',
          'Identify missed bookings and no-shows.',
          'Flag high-intent contacts for same-day follow-up.',
        ],
      },
      {
        heading: 'Marketing Worker Focus',
        items: [
          'Review scheduled content pipeline.',
          'Generate local Coal Region education-first post ideas.',
          'Connect campaign activity back to booking or lead capture.',
        ],
      },
      {
        heading: 'Compliance Reviewer Focus',
        items: [
          'Avoid guarantees unless product-specific and verified.',
          'Keep insurance language education-first.',
          'Route questionable copy for human review before publishing.',
        ],
      },
      {
        heading: 'Systems',
        body: 'Check GitHub main, Vercel deployment, Cloudflare Worker health, Supabase lead schema, and Notion write status.',
      },
    ],
  })

  return NextResponse.json({ ok: true, data })
}

export async function POST(req: NextRequest) {
  return GET(req)
}
