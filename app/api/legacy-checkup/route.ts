export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { upsertLead } from '@/lib/hub/upsert-lead'
import { rateLimit } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'
import { sendMail } from '@/lib/mailer'
import { InquiryNotification, ThankYou } from '@/emails/templates'
import { prisma } from '@/lib/prisma'

type LegacyCheckupBody = {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  sourceContent?: string
  source?: string
  medium?: string
  campaign?: string
  utmTerm?: string
  utmContent?: string
  referrer?: string
  page?: string
  hasLifeInsurance?: boolean
  hasMortgageProtection?: boolean
  hasFinalExpense?: boolean
  hasRetirementPlan?: boolean
  hasLegacyPlan?: boolean
  interestedIn?: string[]
  message?: string
}

function clean(value: unknown, max = 500) {
  return String(value || '').trim().slice(0, max)
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, 'lead')
  if (limited) return limited

  try {
    const body = (await req.json()) as LegacyCheckupBody

    const firstName = clean(body.firstName, 100)
    const lastName = clean(body.lastName, 100)
    const email = clean(body.email, 150)
    const phone = clean(body.phone, 40)

    if (!firstName || (!email && !phone)) {
      return NextResponse.json(
        { ok: false, error: 'First name and either email or phone are required.' },
        { status: 400 },
      )
    }

    const notes = [
      'Legacy Checkup request',
      body.interestedIn?.length ? `Interested in: ${body.interestedIn.join(', ')}` : null,
      body.hasLifeInsurance === false ? 'Gap: no life insurance' : null,
      body.hasMortgageProtection === false ? 'Gap: no mortgage protection' : null,
      body.hasFinalExpense === false ? 'Gap: no final expense plan' : null,
      body.hasRetirementPlan === false ? 'Gap: no retirement income plan' : null,
      body.hasLegacyPlan === false ? 'Gap: no legacy plan' : null,
      body.message ? `Message: ${clean(body.message, 2000)}` : null,
    ].filter(Boolean).join(' | ')

    const { contact, inquiry } = await upsertLead({
      firstName,
      lastName: lastName || null,
      email: email || null,
      phone: phone || null,
      source: clean(body.source || 'legacy_checkup', 100),
      medium: clean(body.medium, 100) || null,
      campaign: clean(body.campaign, 150) || null,
      utmTerm: clean(body.utmTerm, 100) || null,
      utmContent: clean(body.utmContent, 100) || null,
      referrer: clean(body.referrer || req.headers.get('referer'), 500) || null,
      landingPage: clean(body.page || body.sourceContent, 500) || null,
      notes,
      metadata: {
        form: 'legacy-checkup',
        sourceContent: clean(body.sourceContent, 500) || null,
        interestedIn: body.interestedIn ?? [],
        hasLifeInsurance: body.hasLifeInsurance ?? null,
        hasMortgageProtection: body.hasMortgageProtection ?? null,
        hasFinalExpense: body.hasFinalExpense ?? null,
        hasRetirementPlan: body.hasRetirementPlan ?? null,
        hasLegacyPlan: body.hasLegacyPlan ?? null,
      },
    })

    await prisma.legacyCheckupAssessment.create({
      data: {
        contactId: contact.id,
        inquiryId: inquiry.id,
        hasLifeInsurance: body.hasLifeInsurance ?? null,
        hasMortgageProtection: body.hasMortgageProtection ?? null,
        hasFinalExpense: body.hasFinalExpense ?? null,
        hasRetirementPlan: body.hasRetirementPlan ?? null,
        hasLegacyPlan: body.hasLegacyPlan ?? null,
        interestedIn: body.interestedIn ?? [],
        message: clean(body.message, 2000) || null,
      },
    })

    const notifyTo = process.env.NOTIFY_TO
    const thankYouFrom = process.env.THANKYOU_FROM

    const [notifyResult, thankYouResult] = await Promise.allSettled([
      notifyTo
        ? sendMail({
            to: notifyTo,
            from: thankYouFrom || notifyTo,
            subject: `Legacy Checkup request: ${firstName} ${lastName}`.trim(),
            html: InquiryNotification({
              firstName,
              lastName,
              email: email || undefined,
              phone: phone || undefined,
              productInterest: 'Legacy Checkup',
              source: clean(body.source || 'legacy_checkup', 100),
              campaign: clean(body.campaign, 150) || undefined,
            }),
          })
        : Promise.resolve({ skipped: true }),
      email && thankYouFrom
        ? sendMail({
            to: email,
            from: thankYouFrom,
            subject: 'Your Legacy Checkup request — Latimore Life & Legacy',
            html: ThankYou({ firstName }),
          })
        : Promise.resolve({ skipped: true }),
    ])

    const response: Record<string, unknown> = {
      ok: true,
      contactId: contact.id,
      inquiryId: inquiry.id,
    }

    if (notifyResult.status === 'rejected') {
      logger.error({ err: notifyResult.reason }, '[legacy-checkup] admin notification failed')
      response.notification = { ok: false, error: errorMessage(notifyResult.reason) }
    }
    if (thankYouResult.status === 'rejected') {
      logger.error({ err: thankYouResult.reason }, '[legacy-checkup] thank-you email failed')
      response.thankYou = { ok: false, error: errorMessage(thankYouResult.reason) }
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    logger.error({ err: errorMessage(error) }, '[legacy-checkup] submission error')
    return NextResponse.json(
      { ok: false, error: 'Legacy Checkup request failed', detail: errorMessage(error) },
      { status: 500 },
    )
  }
}
