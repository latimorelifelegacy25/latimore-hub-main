export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimit } from '@/lib/rate-limit'
import { upsertLead } from '@/lib/hub/upsert-lead'
import { logger } from '@/lib/logger'
import { sendMetaLeadConversion } from '@/lib/tracking/server-conversions'
import crypto from 'node:crypto'

const LeadSchema = z.object({
  full_name: z.string().min(2).max(150).optional(),
  name: z.string().min(2).max(150).optional(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  phone: z.string().min(7).max(50),
  email: z.string().email().max(191).optional().or(z.literal('')),
  coverage_interest: z.string().max(150).optional(),
  productInterest: z.string().max(150).optional(),
  best_time: z.string().max(80).optional(),
  source: z.string().max(100).optional(),
  utm_source: z.string().max(100).optional(),
  utm_medium: z.string().max(100).optional(),
  utm_campaign: z.string().max(150).optional(),
  utm_term: z.string().max(100).optional(),
  utm_content: z.string().max(100).optional(),
  asset: z.string().max(150).optional(),
  coupon_id: z.string().max(100).optional(),
  leadSessionId: z.string().max(191).optional(),
  pageUrl: z.string().max(500).optional(),
  referrer: z.string().max(500).optional(),
  hp_company: z.string().max(200).optional(),
})

type LeadPayload = z.infer<typeof LeadSchema>

function splitName(payload: LeadPayload) {
  if (payload.firstName || payload.lastName) {
    return {
      firstName: payload.firstName?.trim() || null,
      lastName: payload.lastName?.trim() || null,
    }
  }

  const fullName = (payload.full_name ?? payload.name ?? '').trim()
  const parts = fullName.split(/\s+/).filter(Boolean)
  return {
    firstName: parts[0] ?? null,
    lastName: parts.length > 1 ? parts.slice(1).join(' ') : null,
  }
}

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, 'lead')
  if (limited) return limited

  try {
    const parsed = LeadSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Invalid lead submission.' }, { status: 400 })
    }

    const body = parsed.data
    if (body.hp_company) {
      return NextResponse.json({ ok: true, spam: true }, { status: 202 })
    }

    const fullName = (body.full_name ?? body.name ?? `${body.firstName ?? ''} ${body.lastName ?? ''}`).trim()
    if (!fullName) {
      return NextResponse.json({ ok: false, error: 'Full name is required.' }, { status: 400 })
    }

    const { firstName, lastName } = splitName(body)
    const productInterest = body.coverage_interest ?? body.productInterest ?? 'General'
    const source = body.utm_source ?? body.source ?? 'direct'

    const conversionEventId = crypto.randomUUID()

    const { contact, inquiry } = await upsertLead({
      firstName,
      lastName,
      email: body.email || null,
      phone: body.phone,
      productInterest,
      leadSessionId: body.leadSessionId ?? null,
      source,
      medium: body.utm_medium ?? null,
      campaign: body.utm_campaign ?? null,
      term: body.utm_term ?? null,
      content: body.utm_content ?? null,
      referrer: body.referrer ?? req.headers.get('referer'),
      landingPage: body.pageUrl ?? '/api/leads',
      notes: [
        `Coverage interest: ${productInterest}`,
        body.best_time ? `Best contact time: ${body.best_time}` : null,
        body.asset ? `Asset: ${body.asset}` : null,
        body.coupon_id ? `Coupon ID: ${body.coupon_id}` : null,
      ].filter(Boolean).join(' | '),
      metadata: {
        endpoint: '/api/leads',
        fullName,
        bestTime: body.best_time ?? null,
        asset: body.asset ?? null,
        couponId: body.coupon_id ?? null,
        utmSource: source,
        utmMedium: body.utm_medium ?? null,
        utmCampaign: body.utm_campaign ?? null,
        conversionEventId,
      },
    })

    await sendMetaLeadConversion({
      eventId: conversionEventId,
      email: body.email || null,
      phone: body.phone,
      eventSourceUrl: body.pageUrl ?? req.headers.get('referer'),
      userAgent: req.headers.get('user-agent'),
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip'),
      source,
      campaign: body.utm_campaign ?? null,
    })

    return NextResponse.json(
      { ok: true, contactId: contact.id, inquiryId: inquiry.id, score: inquiry.leadScore, conversionEventId },
      { status: 201 },
    )
  } catch (error) {
    logger.error({ err: error instanceof Error ? error.message : String(error) }, '[api/leads] submission failed')
    return NextResponse.json({ ok: false, error: 'Lead submission failed.' }, { status: 500 })
  }
}
