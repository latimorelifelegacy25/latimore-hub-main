export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimit } from '@/lib/rate-limit'
import { sendMail } from '@/lib/mailer'
import { escapeHtml } from '@/lib/escape-html'
import { logger } from '@/lib/logger'
import { BRAND } from '@/lib/brand'
import { checkCompliance } from '@/lib/ai/compliance'
import { WORKSHEET_IDS, getWorksheet, worksheetToPlainText } from '@/lib/worksheets/content'
import { generateWorksheetPdf } from '@/lib/worksheets/pdf'

const WorksheetRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(150),
  firstName: z.string().trim().max(60).optional().nullable(),
  worksheet: z.enum(WORKSHEET_IDS),
})

const GENERIC_ERROR = { ok: false, error: 'We could not email your worksheet. Please try again later.' }

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, 'intake')
  if (limited) return limited

  try {
    const json = await req.json().catch(() => null)
    const parsed = WorksheetRequestSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Please check your email address and try again.' }, { status: 422 })
    }
    const body = parsed.data

    const from = process.env.THANKYOU_FROM || process.env.RESEND_FROM_EMAIL || process.env.OUTBOUND_FROM_EMAIL
    if (!from) {
      logger.error('[worksheet] sender address not configured')
      return NextResponse.json(GENERIC_ERROR, { status: 500 })
    }

    const doc = getWorksheet(body.worksheet)

    // Fail closed on any critical compliance finding.
    const review = checkCompliance(worksheetToPlainText(doc))
    if (review.violations.some((v) => v.severity === 'critical')) {
      logger.error(
        { rules: review.violations.filter((v) => v.severity === 'critical').map((v) => v.rule) },
        '[worksheet] compliance review failed',
      )
      return NextResponse.json(GENERIC_ERROR, { status: 500 })
    }

    const pdf = await generateWorksheetPdf(doc)
    const greeting = body.firstName ? `Hello ${escapeHtml(body.firstName)},` : 'Hello,'
    const bookingUrl = `${BRAND.baseUrl}/book`
    const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#0E1A2B;line-height:1.5">
<p>${greeting}</p>
<p>Your ${escapeHtml(doc.title)} is attached as a PDF. You can print it or fill it in on your device, then bring it to your consultation.</p>
<p>If you would like to talk it through, you can schedule a free consultation at <a href="${escapeHtml(bookingUrl)}">${escapeHtml(bookingUrl)}</a> or call ${escapeHtml(BRAND.phone)}.</p>
<p style="font-size:12px;color:#475467">This worksheet is for general education only and is not a quote, a recommendation, or an offer of any product. Availability, benefits, underwriting, and cost vary by coverage type, applicant, state, and issuing insurer. ${escapeHtml(BRAND.fullName)} | PA DOI License #${escapeHtml(BRAND.paLicense)} | NIPR #${escapeHtml(BRAND.nipr)}</p>
</div>`

    const sent = await sendMail({
      to: body.email,
      from,
      subject: doc.emailSubject,
      html,
      attachments: [{ filename: doc.filename, content: Buffer.from(pdf) }],
    })

    if (!sent.ok) {
      logger.error('[worksheet] email delivery failed')
      return NextResponse.json(GENERIC_ERROR, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    logger.error('[worksheet] request failed')
    return NextResponse.json(GENERIC_ERROR, { status: 500 })
  }
}
