export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { sendMail } from '@/lib/mailer'
import { logger } from '@/lib/logger'

const JoinBodySchema = z.object({
  // Universal required
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().min(7).max(40),

  // Path selection
  applicationType: z.enum(['partnership', 'agent', 'both']).nullable().optional(),

  // Partnership fields
  organizationName: z.string().max(200).nullable().optional(),
  organizationType: z.string().max(100).nullable().optional(),
  partnershipGoal: z.string().max(2000).nullable().optional(),

  // Agent fields
  currentRole: z.string().max(150).nullable().optional(),
  isLicensed: z.string().max(50).nullable().optional(),
  interestType: z.string().max(50).nullable().optional(),
  agentMotivation: z.string().max(2000).nullable().optional(),

  // Universal optional
  howHeard: z.string().max(100).nullable().optional(),
  referralSource: z.string().max(150).nullable().optional(),
  additionalNotes: z.string().max(2000).nullable().optional(),

  // Hidden/tracking
  leadSessionId: z.string().max(191).nullable().optional(),
  pageUrl: z.string().max(500).nullable().optional(),
  referrer: z.string().max(500).nullable().optional(),
  source: z.string().max(100).nullable().optional(),
  medium: z.string().max(100).nullable().optional(),
  campaign: z.string().max(150).nullable().optional(),
})

function normalizeEmpty(value: any): any {
  if (value === '' || value === undefined) return null
  return value
}

function buildJoinNoteSummary(input: z.infer<typeof JoinBodySchema>) {
  const lines = [
    'Join Application Submission',
    '',
    `Name: ${input.firstName} ${input.lastName}`,
    `Email: ${input.email}`,
    `Phone: ${input.phone}`,
    '',
    `Application Type: ${input.applicationType || 'Not specified'}`,
    '',
  ]

  if (input.applicationType === 'partnership' || input.applicationType === 'both') {
    lines.push('--- Partnership Details ---')
    if (input.organizationName) lines.push(`Organization: ${input.organizationName}`)
    if (input.organizationType) lines.push(`Type: ${input.organizationType}`)
    if (input.partnershipGoal) lines.push(`Goal: ${input.partnershipGoal}`)
    lines.push('')
  }

  if (input.applicationType === 'agent' || input.applicationType === 'both') {
    lines.push('--- Agent Details ---')
    if (input.currentRole) lines.push(`Current Role: ${input.currentRole}`)
    if (input.isLicensed) lines.push(`Licensed: ${input.isLicensed}`)
    if (input.interestType) lines.push(`Interest: ${input.interestType}`)
    if (input.agentMotivation) lines.push(`Motivation: ${input.agentMotivation}`)
    lines.push('')
  }

  if (input.howHeard) lines.push(`How heard: ${input.howHeard}`)
  if (input.referralSource) lines.push(`Referral: ${input.referralSource}`)
  if (input.additionalNotes) lines.push(`Notes: ${input.additionalNotes}`)

  return lines.filter(Boolean).join('\n')
}

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, 'join')
  if (limited) return limited

  const body = await req.json().catch(() => null)
  const parsed = JoinBodySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 422 })
  }

  const input = parsed.data

  // Normalize empty strings
  const normalized = {
    ...input,
    applicationType: normalizeEmpty(input.applicationType),
    organizationName: normalizeEmpty(input.organizationName),
    organizationType: normalizeEmpty(input.organizationType),
    partnershipGoal: normalizeEmpty(input.partnershipGoal),
    currentRole: normalizeEmpty(input.currentRole),
    isLicensed: normalizeEmpty(input.isLicensed),
    interestType: normalizeEmpty(input.interestType),
    agentMotivation: normalizeEmpty(input.agentMotivation),
    howHeard: normalizeEmpty(input.howHeard),
    referralSource: normalizeEmpty(input.referralSource),
    additionalNotes: normalizeEmpty(input.additionalNotes),
    leadSessionId: normalizeEmpty(input.leadSessionId),
    pageUrl: normalizeEmpty(input.pageUrl),
    referrer: normalizeEmpty(input.referrer),
    source: normalizeEmpty(input.source),
    medium: normalizeEmpty(input.medium),
    campaign: normalizeEmpty(input.campaign),
  }

  try {
    // Upsert contact
    const emailLower = normalized.email.toLowerCase()
    let contact = await prisma.contact.findUnique({ where: { email: emailLower } })

    if (contact) {
      contact = await prisma.contact.update({
        where: { id: contact.id },
        data: {
          firstName: normalized.firstName,
          lastName: normalized.lastName,
          phone: normalized.phone,
          primarySource: contact.primarySource ?? normalized.source ?? 'website',
          primaryMedium: contact.primaryMedium ?? normalized.medium ?? 'join',
          primaryCampaign: contact.primaryCampaign ?? normalized.campaign ?? 'join',
          lastActivityAt: new Date(),
        },
      })
    } else {
      contact = await prisma.contact.create({
        data: {
          email: emailLower,
          firstName: normalized.firstName,
          lastName: normalized.lastName,
          phone: normalized.phone,
          primarySource: normalized.source ?? 'website',
          primaryMedium: normalized.medium ?? 'join',
          primaryCampaign: normalized.campaign ?? 'join',
          lastActivityAt: new Date(),
        },
      })
    }

    // Build metadata
    const metadata: Record<string, any> = {
      applicationType: normalized.applicationType,
      howHeard: normalized.howHeard,
      referralSource: normalized.referralSource,
    }

    if (normalized.applicationType === 'partnership' || normalized.applicationType === 'both') {
      metadata.organizationName = normalized.organizationName
      metadata.organizationType = normalized.organizationType
      metadata.partnershipGoal = normalized.partnershipGoal
    }

    if (normalized.applicationType === 'agent' || normalized.applicationType === 'both') {
      metadata.currentRole = normalized.currentRole
      metadata.isLicensed = normalized.isLicensed
      metadata.interestType = normalized.interestType
      metadata.agentMotivation = normalized.agentMotivation
    }

    // Create inquiry
    const inquiry = await prisma.inquiry.create({
      data: {
        contactId: contact.id,
        leadSessionId: normalized.leadSessionId ?? undefined,
        productInterest: 'General', // Using existing enum, will filter by metadata
        stage: 'New',
        source: normalized.source ?? 'website',
        medium: normalized.medium ?? 'join',
        campaign: normalized.campaign ?? 'join',
        landingPage: normalized.pageUrl ?? '/join',
        notes: normalized.additionalNotes ?? undefined,
      },
    })

    // Create detailed note
    const noteSummary = buildJoinNoteSummary(normalized)
    await prisma.note.create({
      data: {
        contactId: contact.id,
        inquiryId: inquiry.id,
        title: `Join Application - ${normalized.applicationType || 'Unspecified'}`,
        body: noteSummary,
        author: 'join-form',
      },
    })

    // Create task
    const displayName = `${normalized.firstName} ${normalized.lastName}`
    const taskTitle =
      normalized.applicationType === 'partnership'
        ? `Follow up with partnership inquiry - ${displayName}`
        : normalized.applicationType === 'agent'
        ? `Follow up with agent applicant - ${displayName}`
        : `Follow up with join inquiry - ${displayName}`

    await prisma.task.create({
      data: {
        title: taskTitle,
        description: `${normalized.applicationType || 'Join'} application submitted on ${new Date().toLocaleDateString()}`,
        status: 'Open',
        dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
        contactId: contact.id,
        inquiryId: inquiry.id,
      },
    })

    // Record system event
    await prisma.systemEvent.create({
      data: {
        type: 'join.application_submitted',
        contactId: contact.id,
        inquiryId: inquiry.id,
        leadSessionId: normalized.leadSessionId ?? undefined,
        source: normalized.source ?? 'website',
        medium: normalized.medium ?? 'join',
        campaign: normalized.campaign ?? 'join',
        payload: {
          applicationType: normalized.applicationType,
          organizationName: normalized.organizationName,
          currentRole: normalized.currentRole,
        },
        metadata,
      },
    })

    // Send confirmation email to applicant
    if (process.env.THANKYOU_FROM && contact.email) {
      try {
        await sendMail({
          to: contact.email,
          from: process.env.THANKYOU_FROM,
          subject: 'Thank you for your interest in joining our mission',
          html: `
            <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <h1 style="color: #0E1A2B; margin-bottom: 16px;">Thank you, ${normalized.firstName}.</h1>
              <p style="color: #475467; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                We've received your interest in ${
                  normalized.applicationType === 'partnership'
                    ? 'partnering with us'
                    : normalized.applicationType === 'agent'
                    ? 'joining our team'
                    : 'working with us'
                }.
              </p>
              <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <h2 style="color: #0E1A2B; font-size: 18px; margin: 0 0 16px;">What happens next</h2>
                <ol style="color: #475467; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>We'll review your submission and gather context about your goals.</li>
                  <li>Expect a call or email from us <strong>within 2 business days</strong>.</li>
                  <li>We'll schedule a brief 15-minute intro conversation to explore fit.</li>
                  <li>If it's a mutual fit, we'll outline next steps together—no pressure.</li>
                </ol>
              </div>
              <p style="color: #667085; font-size: 14px; line-height: 1.6;">
                In the meantime, feel free to learn more about our mission at 
                <a href="https://latimorelifelegacy.com/about" style="color: #C9A24D;">latimorelifelegacy.com/about</a>.
              </p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
              <p style="color: #667085; font-size: 13px;">
                Latimore Life & Legacy<br>
                Protecting Today. Securing Tomorrow.
              </p>
            </div>
          `,
        })
      } catch (err) {
        logger.error({ err }, 'Failed to send join confirmation email')
      }
    }

    // Send internal notification to owner
    if (process.env.NOTIFY_TO && process.env.THANKYOU_FROM) {
      try {
        const subject = `New ${
          normalized.applicationType === 'partnership' ? 'Partnership' : normalized.applicationType === 'agent' ? 'Agent' : 'Join'
        } Application - ${displayName}`

        await sendMail({
          to: process.env.NOTIFY_TO,
          from: process.env.THANKYOU_FROM,
          subject,
          html: `
            <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <h1 style="color: #0E1A2B; margin-bottom: 8px;">New ${normalized.applicationType || 'Join'} Application</h1>
              <p style="color: #C9A24D; font-weight: 600; margin-bottom: 24px;">${displayName}</p>
              
              <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <h2 style="color: #0E1A2B; font-size: 16px; margin: 0 0 12px;">Contact Info</h2>
                <p style="margin: 4px 0; color: #475467;"><strong>Email:</strong> ${contact.email}</p>
                <p style="margin: 4px 0; color: #475467;"><strong>Phone:</strong> ${normalized.phone}</p>
                ${normalized.howHeard ? `<p style="margin: 4px 0; color: #475467;"><strong>How heard:</strong> ${normalized.howHeard}</p>` : ''}
                ${normalized.referralSource ? `<p style="margin: 4px 0; color: #475467;"><strong>Referral:</strong> ${normalized.referralSource}</p>` : ''}
              </div>

              ${
                normalized.organizationName
                  ? `
              <div style="background: #eff7ff; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <h2 style="color: #0E1A2B; font-size: 16px; margin: 0 0 12px;">Partnership Details</h2>
                <p style="margin: 4px 0; color: #475467;"><strong>Organization:</strong> ${normalized.organizationName}</p>
                ${normalized.organizationType ? `<p style="margin: 4px 0; color: #475467;"><strong>Type:</strong> ${normalized.organizationType}</p>` : ''}
                ${normalized.partnershipGoal ? `<p style="margin: 8px 0 0; color: #475467;">${normalized.partnershipGoal}</p>` : ''}
              </div>
              `
                  : ''
              }

              ${
                normalized.currentRole
                  ? `
              <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <h2 style="color: #0E1A2B; font-size: 16px; margin: 0 0 12px;">Agent Details</h2>
                <p style="margin: 4px 0; color: #475467;"><strong>Current Role:</strong> ${normalized.currentRole}</p>
                ${normalized.isLicensed ? `<p style="margin: 4px 0; color: #475467;"><strong>Licensed:</strong> ${normalized.isLicensed}</p>` : ''}
                ${normalized.interestType ? `<p style="margin: 4px 0; color: #475467;"><strong>Interest:</strong> ${normalized.interestType}</p>` : ''}
                ${normalized.agentMotivation ? `<p style="margin: 8px 0 0; color: #475467;">${normalized.agentMotivation}</p>` : ''}
              </div>
              `
                  : ''
              }

              ${
                normalized.additionalNotes
                  ? `
              <div style="background: #fefce8; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <h2 style="color: #0E1A2B; font-size: 16px; margin: 0 0 12px;">Additional Notes</h2>
                <p style="margin: 0; color: #475467;">${normalized.additionalNotes}</p>
              </div>
              `
                  : ''
              }

              <p style="color: #667085; font-size: 14px; margin-top: 24px;">
                <strong>Task created:</strong> Follow up within 2 business days<br>
                <strong>Contact ID:</strong> ${contact.id}<br>
                <strong>Inquiry ID:</strong> ${inquiry.id}
              </p>
            </div>
          `,
        })
      } catch (err) {
        logger.error({ err }, 'Failed to send join notification email')
      }
    }

    return NextResponse.json({
      ok: true,
      contactId: contact.id,
      inquiryId: inquiry.id,
      message: 'Application submitted successfully',
    })
  } catch (error: any) {
    logger.error({ err: error.message }, 'Join application error')
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 })
  }
}