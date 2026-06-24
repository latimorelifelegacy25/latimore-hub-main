export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { sendMail } from '@/lib/mailer'
import { logger } from '@/lib/logger'
import { LeadIntent, LeadSource, LeadStatus } from '@prisma/client'
import { inferLeadSource } from '@/lib/tracking/infer'
import { triggerLeadScoring } from '@/lib/ai/lead-score-trigger'

const CONSENT_TEXT = 'I consent to Latimore Life & Legacy LLC contacting me by phone, text, or email about joining the team. I understand this is an interest form and not an employment contract.'

const JoinBodySchema = z.object({
  fullName: z.string().min(2).max(200),
  phone: z.string().min(7).max(40),
  email: z.string().email().max(200),
  cityState: z.string().max(150).optional().nullable(),
  bestContactMethod: z.string().min(1).max(50),
  bestContactTime: z.string().min(1).max(50),
  interestReason: z.string().min(3).max(3000),
  lookingFor: z.array(z.string()).default([]),
  selfDescription: z.string().min(1).max(100),
  licenseStatus: z.string().min(1).max(100),
  licensesHeld: z.array(z.string()).default([]),
  priorExperience: z.string().max(100).optional().nullable(),
  experienceDescription: z.string().max(3000).optional().nullable(),
  incomeGoal: z.string().min(1).max(100),
  hoursPerWeek: z.string().min(1).max(100),
  comfortLevel: z.number().int().min(1).max(5),
  willingToTrain: z.string().min(1).max(100),
  motivation: z.string().max(3000).optional().nullable(),
  values: z.array(z.string()).default([]),
  mentorshipNeeds: z.string().max(3000).optional().nullable(),
  availableForCall: z.string().min(1).max(50),
  preferredCallTime: z.string().max(150).optional().nullable(),
  questions: z.string().max(3000).optional().nullable(),
  consentAccepted: z.literal(true),
  leadSessionId: z.string().max(191).optional().nullable(),
  pageUrl: z.string().max(500).optional().nullable(),
  referrer: z.string().max(500).optional().nullable(),
  source: z.string().max(100).optional().nullable(),
  medium: z.string().max(100).optional().nullable(),
  campaign: z.string().max(150).optional().nullable(),
})

type JoinInput = z.infer<typeof JoinBodySchema>

function clean(value?: string | null) { return value?.trim() || null }
function splitName(fullName: string) { const parts = fullName.trim().split(/\s+/); return { firstName: parts[0] || null, lastName: parts.length > 1 ? parts.slice(1).join(' ') : null } }
function summary(input: JoinInput) {
  return [
    'Join Our Team Interest Form', '', `Name: ${input.fullName}`, `Email: ${input.email}`, `Phone: ${input.phone}`, `City/State: ${clean(input.cityState) ?? 'Not provided'}`, '',
    `Best contact method: ${input.bestContactMethod}`, `Best contact time: ${input.bestContactTime}`, '',
    `Interested because: ${input.interestReason}`, `Looking for: ${input.lookingFor.join(', ') || 'Not provided'}`, `Self description: ${input.selfDescription}`, '',
    `License status: ${input.licenseStatus}`, `Licenses held: ${input.licensesHeld.join(', ') || 'None listed'}`, `Prior experience: ${clean(input.priorExperience) ?? 'Not provided'}`, `Experience description: ${clean(input.experienceDescription) ?? 'Not provided'}`, '',
    `Income goal: ${input.incomeGoal}`, `Hours per week: ${input.hoursPerWeek}`, `Comfort level: ${input.comfortLevel}/5`, `Willing to train/follow compliance: ${input.willingToTrain}`, `Motivation: ${clean(input.motivation) ?? 'Not provided'}`, '',
    `Values: ${input.values.join(', ') || 'Not provided'}`, `Mentorship needs: ${clean(input.mentorshipNeeds) ?? 'Not provided'}`, '',
    `Available for call: ${input.availableForCall}`, `Preferred call time: ${clean(input.preferredCallTime) ?? 'Not provided'}`, `Questions: ${clean(input.questions) ?? 'Not provided'}`, '',
    `Consent accepted: ${input.consentAccepted ? 'Yes' : 'No'}`, `Consent text: ${CONSENT_TEXT}`,
  ].join('\n')
}

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, 'join')
  if (limited) return limited

  const body = await req.json().catch(() => null)
  const parsed = JoinBodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 422 })

  const input = parsed.data
  const emailLower = input.email.trim().toLowerCase()
  const phone = input.phone.trim()
  const fullName = input.fullName.trim()
  const { firstName, lastName } = splitName(fullName)
  const source = clean(input.source) ?? 'website'
  const medium = clean(input.medium) ?? 'join'
  const campaign = clean(input.campaign) ?? 'join-team'
  const sourceType = inferLeadSource({ utmSource: source, utmMedium: medium, referrer: clean(input.referrer), landingPage: clean(input.pageUrl) ?? '/join' })
  const intent = LeadIntent.JOIN_AGENT
  const inquiryStatus = LeadStatus.JOIN_EXPLORING

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existingContact = await tx.contact.findFirst({ where: { OR: [{ email: emailLower }, { phone }] } })
      const protectedStatuses = new Set<LeadStatus>([LeadStatus.BOOKED, LeadStatus.IN_CONSULT, LeadStatus.REFERRED_TO_ETHOS, LeadStatus.ETHOS_APPLIED, LeadStatus.ETHOS_APPROVED, LeadStatus.CLOSED_WON])
      const contact = existingContact
        ? await tx.contact.update({ where: { id: existingContact.id }, data: { email: emailLower, phone, fullName, firstName, lastName, primarySource: existingContact.primarySource ?? source, primaryMedium: existingContact.primaryMedium ?? medium, primaryCampaign: existingContact.primaryCampaign ?? campaign, primarySourceType: existingContact.primarySourceType === LeadSource.UNKNOWN ? sourceType : existingContact.primarySourceType, primaryIntent: existingContact.primaryIntent === LeadIntent.UNKNOWN ? intent : existingContact.primaryIntent, currentIntent: protectedStatuses.has(existingContact.status) ? existingContact.currentIntent : intent, status: protectedStatuses.has(existingContact.status) ? existingContact.status : inquiryStatus, lastActivityAt: new Date() } })
        : await tx.contact.create({ data: { email: emailLower, phone, fullName, firstName, lastName, primarySource: source, primaryMedium: medium, primaryCampaign: campaign, primarySourceType: sourceType, primaryIntent: intent, currentIntent: intent, status: inquiryStatus, lastActivityAt: new Date() } })

      const inquiry = await tx.inquiry.create({ data: { contactId: contact.id, productInterest: 'General', stage: 'New', source, medium, campaign, landingPage: clean(input.pageUrl) ?? '/join', intent, status: inquiryStatus, sourceType, notes: input.interestReason } })
      const application = await tx.joinApplication.create({ data: { contactId: contact.id, inquiryId: inquiry.id, fullName, firstName, lastName, phone, email: emailLower, cityState: clean(input.cityState), bestContactMethod: input.bestContactMethod, bestContactTime: input.bestContactTime, interestReason: input.interestReason, lookingFor: input.lookingFor, selfDescription: input.selfDescription, licenseStatus: input.licenseStatus, licensesHeld: input.licensesHeld, priorExperience: clean(input.priorExperience), experienceDescription: clean(input.experienceDescription), incomeGoal: input.incomeGoal, hoursPerWeek: input.hoursPerWeek, comfortLevel: input.comfortLevel, willingToTrain: input.willingToTrain, motivation: clean(input.motivation), values: input.values, mentorshipNeeds: clean(input.mentorshipNeeds), availableForCall: input.availableForCall, preferredCallTime: clean(input.preferredCallTime), questions: clean(input.questions), consentAccepted: input.consentAccepted, consentText: CONSENT_TEXT, leadSessionId: clean(input.leadSessionId), pageUrl: clean(input.pageUrl), referrer: clean(input.referrer), source, medium, campaign, status: 'New' } })

      await tx.note.create({ data: { contactId: contact.id, inquiryId: inquiry.id, title: `Join Application - ${fullName}`, body: summary(input), author: 'join-form' } })
      await tx.task.create({ data: { title: `Follow up with join applicant - ${fullName}`, description: `New join application submitted. Preferred contact: ${input.bestContactMethod}. Preferred time: ${input.bestContactTime}.`, status: 'Open', dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000), contactId: contact.id, inquiryId: inquiry.id } })
      await tx.joinFormEvent.create({ data: { applicationId: application.id, leadSessionId: clean(input.leadSessionId), eventType: 'join_form_submitted', pageUrl: clean(input.pageUrl), referrer: clean(input.referrer), source, medium, campaign, metadata: { comfortLevel: input.comfortLevel, incomeGoal: input.incomeGoal, hoursPerWeek: input.hoursPerWeek, licenseStatus: input.licenseStatus } } })
      await tx.systemEvent.create({ data: { type: 'join.application_submitted', contactId: contact.id, inquiryId: inquiry.id, leadSessionId: undefined, source, medium, campaign, payload: { applicationId: application.id, intent, status: 'New' }, metadata: { availableForCall: input.availableForCall, bestContactMethod: input.bestContactMethod } } })
      return { contact, inquiry, application }
    })

    await triggerLeadScoring({ contactId: result.contact.id, inquiryId: result.inquiry.id, reason: 'new_join_application' }).catch((err) => logger.error({ err }, 'Failed to trigger join lead scoring'))

    if (process.env.THANKYOU_FROM && result.contact.email) await sendMail({ to: result.contact.email, from: process.env.THANKYOU_FROM, subject: 'Thank you for your interest in joining Latimore Life & Legacy', html: `<p>Thank you, ${firstName ?? fullName}. Your join application has been received.</p><p>The next step is a short introductory conversation to learn more about your goals and answer your questions.</p><p>Protect families. Secure futures. Build legacies.<br />#TheBeatGoesOn</p>` }).catch((err) => logger.error({ err }, 'Failed to send join confirmation email'))
    if (process.env.NOTIFY_TO && process.env.THANKYOU_FROM) await sendMail({ to: process.env.NOTIFY_TO, from: process.env.THANKYOU_FROM, subject: `New Join Application - ${fullName}`, html: `<p>New join application from <strong>${fullName}</strong>.</p><p>Email: ${emailLower}<br />Phone: ${phone}<br />Application ID: ${result.application.id}</p>` }).catch((err) => logger.error({ err }, 'Failed to send join notification email'))

    return NextResponse.json({ ok: true, contactId: result.contact.id, inquiryId: result.inquiry.id, applicationId: result.application.id, message: 'Application submitted successfully' })
  } catch (error: any) {
    logger.error({ err: error }, 'Join application error')
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 })
  }
}
