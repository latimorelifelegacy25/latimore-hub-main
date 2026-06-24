export const dynamic = 'force-dynamic'
export { handleOptions as OPTIONS } from '@/lib/hub/cors'

import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { withCors } from '@/lib/hub/cors'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'
import { ProductFitSchema } from '@/lib/schemas'
import { upsertLead } from '@/lib/hub/upsert-lead'
import { cleanString, normalizeProductInterest } from '@/lib/hub/normalizers'
import { getProductBySlug } from '@/lib/products/catalog'
import { recommendProduct } from '@/lib/products/recommendation'

function splitFullName(fullName: string) {
  const parts = fullName.trim().replace(/\s+/g, ' ').split(' ')
  const firstName = parts.shift() ?? ''
  const lastName = parts.join(' ')
  return { firstName, lastName }
}

function nullable(value?: string | null, max = 500) {
  return cleanString(value ?? null, max)
}

function buildNotes(input: {
  selectedProductName?: string | null
  recommendedPrimary: string
  recommendedSecondary?: string | null
  timeline?: string | null
  bestContactTime?: string | null
  notes?: string | null
  reasons: string[]
}) {
  return [
    'Product Fit request',
    input.selectedProductName ? `Selected product: ${input.selectedProductName}` : null,
    `Recommended primary: ${input.recommendedPrimary}`,
    input.recommendedSecondary ? `Recommended secondary: ${input.recommendedSecondary}` : null,
    input.timeline ? `Timeline: ${input.timeline}` : null,
    input.bestContactTime ? `Best contact time: ${input.bestContactTime}` : null,
    input.reasons.length ? `Reasons: ${input.reasons.join('; ')}` : null,
    input.notes ? `Message: ${input.notes}` : null,
  ].filter(Boolean).join(' | ')
}

export const POST = withCors(async (req: NextRequest) => {
  const limited = await rateLimit(req, 'lead')
  if (limited) return limited

  const body = await req.json().catch(() => null)
  const parsed = ProductFitSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 422 })
  }

  const data = parsed.data
  if (data.hp_company) {
    return NextResponse.json({ ok: true, spam: true }, { status: 202 })
  }

  try {
    const selectedProduct = getProductBySlug(data.selectedProductSlug)
    const recommendation = recommendProduct({
      productInterest: data.productInterest,
      lifeStage: data.lifeStage,
      hasMortgage: data.hasMortgage,
      hasDependents: data.hasDependents,
      ownsBusiness: data.ownsBusiness,
      hasEmployees: data.hasEmployees,
      wantsRetirementIncome: data.wantsRetirementIncome,
      wantsLegacyPlanning: data.wantsLegacyPlanning,
      timeline: data.timeline,
    })

    const fallbackInterest = selectedProduct?.productInterest ?? data.productInterest ?? 'General'
    const productInterest = recommendation.score > 0 ? recommendation.primary : normalizeProductInterest(fallbackInterest)
    const { firstName, lastName } = splitFullName(data.fullName)
    const selectedProductSlug = nullable(data.selectedProductSlug, 100)
    const county = nullable(data.county, 100)
    const state = nullable(data.state, 100)
    const pageUrl = nullable(data.pageUrl, 500)
    const referrer = nullable(data.referrer ?? req.headers.get('referer'), 500)
    const notes = buildNotes({
      selectedProductName: selectedProduct?.name ?? selectedProductSlug,
      recommendedPrimary: recommendation.primary,
      recommendedSecondary: recommendation.secondary,
      timeline: data.timeline,
      bestContactTime: nullable(data.bestContactTime, 80),
      notes: nullable(data.notes, 2000),
      reasons: recommendation.reasons,
    })

    const { contact, inquiry } = await upsertLead({
      firstName,
      lastName: lastName || null,
      email: data.email || null,
      phone: data.phone,
      county,
      productInterest,
      leadSessionId: nullable(data.leadSessionId, 191),
      source: nullable(data.source || 'product_fit', 100),
      medium: nullable(data.medium, 100),
      campaign: nullable(data.campaign, 150),
      term: nullable(data.term, 100),
      content: nullable(data.content, 100),
      referrer,
      landingPage: pageUrl,
      notes,
      metadata: {
        form: 'product-fit',
        selectedProductSlug,
        selectedProductName: selectedProduct?.name ?? null,
        selectedProductInterest: selectedProduct?.productInterest ?? null,
        recommendation,
        lifeStage: data.lifeStage ?? null,
        state,
        county,
        timeline: data.timeline ?? null,
        bestContactTime: data.bestContactTime ?? null,
      },
    })

    const assessment = await prisma.legacyCheckupAssessment.create({
      data: {
        contactId: contact.id,
        inquiryId: inquiry.id,
        leadSessionId: nullable(data.leadSessionId, 191),
        hasLifeInsurance: null,
        hasMortgageProtection: data.hasMortgage ?? null,
        hasFinalExpense: null,
        hasRetirementPlan: data.wantsRetirementIncome ?? null,
        hasLegacyPlan: data.wantsLegacyPlanning ?? null,
        interestedIn: [productInterest],
        message: nullable(data.notes, 2000),
        lifeStage: data.lifeStage ?? null,
        state,
        county,
        timeline: data.timeline ?? null,
        bestContactTime: nullable(data.bestContactTime, 80),
        selectedProductSlug,
        recommendedPrimary: recommendation.primary,
        recommendedSecondary: recommendation.secondary,
        score: recommendation.score,
        answers: {
          lifeStage: data.lifeStage ?? null,
          hasMortgage: data.hasMortgage ?? null,
          hasDependents: data.hasDependents ?? null,
          ownsBusiness: data.ownsBusiness ?? null,
          hasEmployees: data.hasEmployees ?? null,
          wantsRetirementIncome: data.wantsRetirementIncome ?? null,
          wantsLegacyPlanning: data.wantsLegacyPlanning ?? null,
          timeline: data.timeline ?? null,
          bestContactTime: data.bestContactTime ?? null,
          selectedProductSlug,
        } as Prisma.InputJsonValue,
        attribution: {
          pageUrl,
          referrer,
          source: nullable(data.source, 100),
          medium: nullable(data.medium, 100),
          campaign: nullable(data.campaign, 150),
          term: nullable(data.term, 100),
          content: nullable(data.content, 100),
          leadSessionId: nullable(data.leadSessionId, 191),
        } as Prisma.InputJsonValue,
      },
    })

    await prisma.event.create({
      data: {
        eventType: 'legacy_checkup_completed',
        leadSessionId: nullable(data.leadSessionId, 191) ?? undefined,
        contactId: contact.id,
        inquiryId: inquiry.id,
        pageUrl: pageUrl ?? undefined,
        referrer: referrer ?? undefined,
        source: nullable(data.source || 'product_fit', 100) ?? undefined,
        medium: nullable(data.medium, 100) ?? undefined,
        campaign: nullable(data.campaign, 150) ?? undefined,
        county: county ?? undefined,
        productInterest,
        metadata: {
          form: 'product-fit',
          assessmentId: assessment.id,
          selectedProductSlug,
          recommendation,
        } as Prisma.InputJsonValue,
      },
    })

    await prisma.systemEvent.create({
      data: {
        type: 'product_fit.completed',
        contactId: contact.id,
        inquiryId: inquiry.id,
        leadSessionId: nullable(data.leadSessionId, 191),
        source: nullable(data.source || 'product_fit', 100),
        medium: nullable(data.medium, 100),
        campaign: nullable(data.campaign, 150),
        payload: {
          assessmentId: assessment.id,
          productInterest,
          selectedProductSlug,
          recommendation,
        } as Prisma.InputJsonValue,
      },
    })

    return NextResponse.json({
      ok: true,
      contactId: contact.id,
      inquiryId: inquiry.id,
      assessmentId: assessment.id,
      recommendation,
    })
  } catch (error) {
    logger.error({ err: error instanceof Error ? error.message : String(error) }, '[product-fit] submission error')
    return NextResponse.json({ ok: false, error: 'Product fit submission failed' }, { status: 500 })
  }
})
