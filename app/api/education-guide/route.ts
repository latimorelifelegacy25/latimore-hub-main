export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimit } from '@/lib/rate-limit'
import { sendMail } from '@/lib/mailer'
import { escapeHtml } from '@/lib/escape-html'
import { logger } from '@/lib/logger'
import { BRAND } from '@/lib/brand'
import { PA_COUNTIES } from '@/lib/pa-counties'
import { checkCompliance } from '@/lib/ai/compliance'
import { GUIDE_PRIORITIES, buildGuide, guideToPlainText } from '@/lib/education-guide/content'
import { generateGuidePdf } from '@/lib/education-guide/pdf'

const GuideRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(150),
  firstName: z.string().trim().max(60).optional(),
  priorities: z.array(z.enum(GUIDE_PRIORITIES)).min(1).max(GUIDE_PRIORITIES.length),
  county: z.enum(PA_COUNTIES).optional(),
  // Honeypot: real visitors never fill this in.
  website: z.string().max(200).optional(),
})

const GENERIC_ERROR = { ok: false, error: 'We could not send your guide. Please try again later.' }

export async function POST(req: NextRequest) {
  // Feature flag: default OFF until the owner has reviewed the copy.
  if (process.env.EDUCATION_GUIDE_ENABLED !== 'true') {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
  }

  const limited = await rateLimit(req, 'intake')
  if (limited) return limited

  try {
    const json = await req.json().catch(() => null)
    const parsed = GuideRequestSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Please check your details and try again.' }, { status: 422 })
    }
    const body = parsed.data

    // Honeypot tripped: pretend success so bots learn nothing.
    if (body.website) return NextResponse.json({ ok: true })

    const from = process.env.THANKYOU_FROM || process.env.RESEND_FROM_EMAIL || process.env.OUTBOUND_FROM_EMAIL
    if (!from) {
      logger.error('[education-guide] sender address not configured')
      return NextResponse.json(GENERIC_ERROR, { status: 500 })
    }

    const guide = buildGuide({
      firstName: body.firstName,
      priorities: body.priorities,
      county: body.county,
    })

    // Fail closed on any critical compliance finding.
    const review = checkCompliance(guideToPlainText(guide))
    if (review.violations.some((v) => v.severity === 'critical')) {
      logger.error(
        { rules: review.violations.filter((v) => v.severity === 'critical').map((v) => v.rule) },
        '[education-guide] compliance review failed',
      )
      return NextResponse.json(GENERIC_ERROR, { status: 500 })
    }

    const pdf = await generateGuidePdf(guide)

    const greeting = body.firstName ? `Hello ${escapeHtml(body.firstName)},` : 'Hello,'
    const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#0E1A2B;line-height:1.5">
<p>${greeting}</p>
<p>Your Legacy Checkup education guide is attached as a PDF. It lists general topics and questions you may want to review with a licensed professional.</p>
<p>If you would like to talk it through, you can schedule a free consultation at <a href="${escapeHtml(guide.bookingUrl)}">${escapeHtml(guide.bookingUrl)}</a> or call ${escapeHtml(BRAND.phone)}.</p>
<p style="font-size:12px;color:#475467">This guide is for general education only and is not a recommendation or an offer of any product. Benefits are not guaranteed unless stated in a policy contract, and availability is subject to carrier terms and underwriting. ${escapeHtml(BRAND.fullName)} | PA DOI License #${escapeHtml(BRAND.paLicense)} | NIPR #${escapeHtml(BRAND.nipr)}</p>
</div>`

    const sent = await sendMail({
      to: body.email,
      from,
      subject: 'Your Legacy Checkup education guide',
      html,
      attachments: [{ filename: guide.filename, content: Buffer.from(pdf) }],
    })

    if (!sent.ok) {
      logger.error('[education-guide] email delivery failed')
      return NextResponse.json(GENERIC_ERROR, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    logger.error('[education-guide] request failed')
    return NextResponse.json(GENERIC_ERROR, { status: 500 })
  }
}
