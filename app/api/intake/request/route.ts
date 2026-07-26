export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { upsertLead } from '@/lib/hub/upsert-lead'
import { captureException } from '@/lib/error-tracking'
import { sendMail } from '@/lib/mailer'
import { InquiryNotification, ThankYou } from '@/emails/templates'
import { triggerLeadScoring } from '@/lib/ai/lead-score-trigger'

const BodySchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().max(191),
  phone: z.string().min(7).max(40),

  mailingAddress: z.string().max(200).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().min(2).max(100),
  zip: z.string().max(20).optional().nullable(),
  dateOfBirth: z.string().max(50).optional().nullable(),
  jobTitle: z.string().max(120).optional().nullable(),
  height: z.string().max(50).optional().nullable(),
  weight: z.string().max(50).optional().nullable(),

  maritalStatus: z.enum(['Single', 'Married', 'Separated', 'Widowed']).optional().nullable(),
  childrenCount: z.number().int().min(0).max(20).optional().nullable(),
  healthConditions: z.string().max(2000).optional().nullable(),
  tobaccoUse: z.enum(['Yes', 'No']).optional().nullable(),
  familyCriticalIllness: z.enum(['Yes', 'No', 'Unsure']).optional().nullable(),

  monthlyBudget: z.string().max(50).optional().nullable(),
  hasExistingInsurance: z.enum(['Yes', 'No']).optional().nullable(),
  existingInsuranceTypes: z.array(z.string().max(100)).max(20).optional().nullable(),

  county: z.string().max(100).optional().nullable(),
  productInterest: z.string().max(100).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  consentToContact: z.literal(true),

  leadSessionId: z.string().max(191).optional().nullable(),
  pageUrl: z.string().max(500).optional().nullable(),
  referrer: z.string().max(500).optional().nullable(),
  source: z.string().max(100).optional().nullable(),
  medium: z.string().max(100).optional().nullable(),
  campaign: z.string().max(150).optional().nullable(),
  term: z.string().max(100).optional().nullable(),
  content: z.string().max(100).optional().nullable(),
})

type IntakeInput = z.infer<typeof BodySchema>

function buildIntakeSummary(input: IntakeInput) {
  return [
    'Native Consultation Intake Request',
    '',
    `Name: ${input.firstName} ${input.lastName}`,
    `Email: ${input.email}`,
    `Phone: ${input.phone}`,
    input.mailingAddress ? `Address: ${input.mailingAddress}` : null,
    input.city ? `City: ${input.city}` : null,
    `State: ${input.state}`,
    input.zip ? `ZIP: ${input.zip}` : null,
    input.county ? `County: ${input.county}` : null,
    input.dateOfBirth ? `Date of Birth: ${input.dateOfBirth}` : null,
    input.jobTitle ? `Industry / Job Title: ${input.jobTitle}` : null,
    input.height ? `Height: ${input.height}` : null,
    input.weight ? `Weight: ${input.weight}` : null,
    input.maritalStatus ? `Marital Status: ${input.maritalStatus}` : null,
    input.childrenCount !== null && input.childrenCount !== undefined
      ? `Children / Dependents: ${input.childrenCount}`
      : null,
    input.tobaccoUse ? `Tobacco / Nicotine Use: ${input.tobaccoUse}` : null,
    input.healthConditions ? `Health Conditions: ${input.healthConditions}` : null,
    input.familyCriticalIllness
      ? `Family History of Critical Illness: ${input.familyCriticalIllness}`
      : null,
    input.monthlyBudget ? `Monthly Protection Budget: ${input.monthlyBudget}` : null,
    input.hasExistingInsurance ? `Existing Coverage: ${input.hasExistingInsurance}` : null,
    input.existingInsuranceTypes?.length
      ? `Existing Policy Types: ${input.existingInsuranceTypes.join(', ')}`
      : null,
    input.productInterest ? `Product Interest: ${input.productInterest}` : null,
    input.notes ? `Additional Notes: ${input.notes}` : null,
    'Consent to Contact: Yes',
  ]
    .filter(Boolean)
    .join('\n')
}

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, 'lead')
  if (limited) return limited

  const body = await req.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Please review the required intake fields and try again.' },
      { status: 422 },
    )
  }

  try {
    const input = parsed.data
    const intakeSummary = buildIntakeSummary(input)
    const intakeMetadata = {
      mailingAddress: input.mailingAddress ?? null,
      city: input.city ?? null,
      state: input.state,
      zip: input.zip ?? null,
      dateOfBirth: input.dateOfBirth ?? null,
      jobTitle: input.jobTitle ?? null,
      height: input.height ?? null,
      weight: input.weight ?? null,
      maritalStatus: input.maritalStatus ?? null,
      childrenCount: input.childrenCount ?? null,
      healthConditions: input.healthConditions ?? null,
      tobaccoUse: input.tobaccoUse ?? null,
      familyCriticalIllness: input.familyCriticalIllness ?? null,
      monthlyBudget: input.monthlyBudget ?? null,
      hasExistingInsurance: input.hasExistingInsurance ?? null,
      existingInsuranceTypes: input.existingInsuranceTypes ?? [],
      consentToContact: true,
      requestType: 'consultation_request',
    }

    const { contact, inquiry } = await upsertLead({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      county: input.county,
      productInterest: input.productInterest ?? 'General',
      leadSessionId: input.leadSessionId,
      source: input.source ?? 'website',
      medium: input.medium ?? 'native_intake',
      campaign: input.campaign ?? 'native_consultation_request',
      term: input.term,
      content: input.content,
      referrer: input.referrer,
      landingPage: input.pageUrl ?? '/book',
      notes: intakeSummary,
      metadata: {
        bookingIntent: true,
        consultationRequested: true,
        intake: intakeMetadata,
      },
    })

    await prisma.note.create({
      data: {
        contactId: contact.id,
        inquiryId: inquiry.id,
        title: 'Native Consultation Intake Request',
        body: intakeSummary,
        author: 'native-intake',
      },
    })

    await prisma.task.create({
      data: {
        title: `Contact ${input.firstName} ${input.lastName} to schedule consultation`,
        description: `Native consultation request received for ${input.productInterest ?? 'General protection planning'}.`,
        dueAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
        contactId: contact.id,
        inquiryId: inquiry.id,
      },
    })

    await triggerLeadScoring({
      contactId: contact.id,
      inquiryId: inquiry.id,
      reason: 'consultation_intake_requested',
    })

    const displayName = `${input.firstName} ${input.lastName}`.trim()

    if (process.env.NOTIFY_TO && process.env.THANKYOU_FROM) {
      await sendMail({
        to: process.env.NOTIFY_TO,
        from: process.env.THANKYOU_FROM,
        subject: `New consultation request - ${displayName}`,
        html: InquiryNotification({
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
          productInterest: input.productInterest ?? 'General',
          county: input.county ?? undefined,
          leadSessionId: input.leadSessionId ?? undefined,
          source: input.source ?? 'website',
          campaign: input.campaign ?? 'native_consultation_request',
        }),
      })

      await sendMail({
        to: input.email,
        from: process.env.THANKYOU_FROM,
        subject: 'We received your consultation request',
        html: ThankYou({ firstName: input.firstName }),
      })
    }

    return NextResponse.json(
      {
        ok: true,
        contactId: contact.id,
        inquiryId: inquiry.id,
      },
      { status: 201 },
    )
  } catch (error) {
    await captureException(error, { source: 'api' })
    return NextResponse.json(
      { ok: false, error: 'We could not save your request. Please call or text us.' },
      { status: 500 },
    )
  }
}
