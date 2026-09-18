import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { sendGoogleChatMessage } from '@/lib/google-chat'

export type VisitorIntentInput = {
  eventId: string
  eventType: string
  leadSessionId?: string | null
  contactId?: string | null
  pageUrl?: string | null
  source?: string | null
  medium?: string | null
  campaign?: string | null
  referrer?: string | null
  county?: string | null
  productInterest?: string | null
  metadata?: Record<string, unknown> | null
  occurredAt?: Date | string | null
}

type IntentScoreRow = {
  score: number
  intentLevel: string
  contactId: string | null
}

export type HotVisitorRow = {
  visitorId: string
  score: number
  intentLevel: string
  lastScoredAt: Date
  lastSeenAt: Date
  source: string | null
  medium: string | null
  campaign: string | null
  landingPage: string | null
  county: string | null
  productInterest: string | null
  contactId: string | null
  firstName: string | null
  lastName: string | null
  email: string | null
  phone: string | null
  lastEventType: string | null
  lastPageUrl: string | null
  lastEventAt: Date | null
}

const EVENT_SCORES: Record<string, number> = {
  page_view: 2,
  cta_click: 8,
  call_click: 30,
  text_click: 30,
  email_click: 30,
  book_click: 25,
  form_submit: 40,
  lead_created: 45,
  appointment_booked: 60,
  stage_changed: 5,
  county_selected: 4,
  product_selected: 8,
  lead_magnet_download: 15,
  post_viewed: 2,
  post_created: 0,
  post_published: 0,
  reaction_added: 2,
  legacy_checkup_started: 15,
  legacy_checkup_step_completed: 5,
  legacy_checkup_completed: 35,
  lead_submitted: 45,
  book_consultation_clicked: 25,
  instant_quote_clicked: 25,
  service_card_clicked: 10,
  gbp_service_visit: 5,
}

function pagePath(pageUrl?: string | null) {
  return (pageUrl ?? '').split('?')[0].toLowerCase()
}

function isInternalPage(pageUrl?: string | null) {
  const path = pagePath(pageUrl)
  return path === '/admin' || path.startsWith('/admin/') || path === '/analytics' || path.startsWith('/analytics/')
}

function pageIntentBonus(pageUrl?: string | null): number {
  const path = pagePath(pageUrl)
  if (!path) return 0
  if (path.startsWith('/book')) return 15
  if (path.startsWith('/education/checkup')) return 10
  if (path.startsWith('/products/') || path.startsWith('/services/')) return 5
  if (path === '/services' || path === '/products') return 3
  return 0
}

export function scoreVisitorEvent(input: Pick<VisitorIntentInput, 'eventType' | 'pageUrl'>): number {
  if (isInternalPage(input.pageUrl)) return 0
  return (EVENT_SCORES[input.eventType] ?? 0) + pageIntentBonus(input.pageUrl)
}

async function resolveContactId(leadSessionId: string, suppliedContactId?: string | null) {
  if (suppliedContactId) return suppliedContactId

  const session = await prisma.leadSession.findUnique({
    where: { id: leadSessionId },
    select: { contactId: true },
  })
  return session?.contactId ?? null
}

export async function linkVisitorIdentityToContact(visitorId: string, contactId: string) {
  await prisma.$executeRaw`
    UPDATE public."VisitorIdentity"
    SET contact_id = ${contactId}, last_seen_at = now()
    WHERE visitor_id = ${visitorId}
  `

  await prisma.$executeRaw`
    UPDATE public."LeadIntentScore"
    SET contact_id = ${contactId}, last_scored_at = now()
    WHERE visitor_id = ${visitorId}
  `
}

export async function recordVisitorIntent(input: VisitorIntentInput): Promise<IntentScoreRow | null> {
  const visitorId = input.leadSessionId?.trim()
  if (!visitorId || isInternalPage(input.pageUrl)) return null

  const scoreDelta = scoreVisitorEvent(input)
  const occurredAt = input.occurredAt ? new Date(input.occurredAt) : new Date()
  const safeOccurredAt = Number.isNaN(occurredAt.getTime()) ? new Date() : occurredAt
  const contactId = await resolveContactId(visitorId, input.contactId)
  const intentEventId = `intent_${input.eventId}`
  const visitorIdentityId = `visitor_${visitorId}`
  const metadataJson = JSON.stringify({
    sourceEventId: input.eventId,
    ...(input.metadata ?? {}),
  })

  const previousRows = await prisma.$queryRaw<Array<{ score: number }>>`
    SELECT score
    FROM public."LeadIntentScore"
    WHERE visitor_id = ${visitorId}
    LIMIT 1
  `
  const previousScore = Number(previousRows[0]?.score ?? 0)

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      INSERT INTO public."VisitorIdentity" (
        id,
        visitor_id,
        first_seen_at,
        last_seen_at,
        source,
        medium,
        campaign,
        landing_page,
        referrer,
        county,
        product_interest,
        lead_session_id,
        contact_id,
        created_at
      ) VALUES (
        ${visitorIdentityId},
        ${visitorId},
        ${safeOccurredAt},
        ${safeOccurredAt},
        ${input.source ?? null},
        ${input.medium ?? null},
        ${input.campaign ?? null},
        ${input.pageUrl ?? null},
        ${input.referrer ?? null},
        ${input.county ?? null},
        ${input.productInterest ?? null},
        ${visitorId},
        ${contactId},
        now()
      )
      ON CONFLICT (visitor_id) DO UPDATE SET
        last_seen_at = GREATEST(public."VisitorIdentity".last_seen_at, EXCLUDED.last_seen_at),
        source = COALESCE(public."VisitorIdentity".source, EXCLUDED.source),
        medium = COALESCE(public."VisitorIdentity".medium, EXCLUDED.medium),
        campaign = COALESCE(public."VisitorIdentity".campaign, EXCLUDED.campaign),
        landing_page = COALESCE(public."VisitorIdentity".landing_page, EXCLUDED.landing_page),
        referrer = COALESCE(public."VisitorIdentity".referrer, EXCLUDED.referrer),
        county = COALESCE(EXCLUDED.county, public."VisitorIdentity".county),
        product_interest = COALESCE(EXCLUDED.product_interest, public."VisitorIdentity".product_interest),
        lead_session_id = COALESCE(public."VisitorIdentity".lead_session_id, EXCLUDED.lead_session_id),
        contact_id = COALESCE(EXCLUDED.contact_id, public."VisitorIdentity".contact_id)
    `

    await tx.$executeRaw`
      INSERT INTO public."VisitorIntentEvent" (
        id,
        visitor_id,
        event_type,
        page_url,
        score_delta,
        metadata,
        occurred_at
      ) VALUES (
        ${intentEventId},
        ${visitorId},
        ${input.eventType},
        ${input.pageUrl ?? null},
        ${scoreDelta},
        CAST(${metadataJson} AS jsonb),
        ${safeOccurredAt}
      )
      ON CONFLICT (id) DO NOTHING
    `

    await tx.$queryRaw`SELECT public.recalculate_lead_intent_score(${visitorId})`

    if (contactId) {
      await tx.$executeRaw`
        UPDATE public."LeadIntentScore"
        SET contact_id = ${contactId}
        WHERE visitor_id = ${visitorId}
      `
    }
  })

  const scoreRows = await prisma.$queryRaw<Array<{ score: number; intent_level: string; contact_id: string | null }>>`
    SELECT score, intent_level, contact_id
    FROM public."LeadIntentScore"
    WHERE visitor_id = ${visitorId}
    LIMIT 1
  `

  const row = scoreRows[0]
  if (!row) return null

  const score = Number(row.score ?? 0)
  const intentLevel = row.intent_level
  const resolvedContactId = row.contact_id ?? contactId

  // A visitor may become hot while still anonymous. If they identify later,
  // create the follow-up task then rather than requiring a second threshold crossing.
  if (score >= 80 && resolvedContactId) {
    const existingTask = await prisma.task.findFirst({
      where: {
        contactId: resolvedContactId,
        status: 'Open',
        title: { startsWith: 'Hot website visitor follow-up' },
      },
      select: { id: true },
    })

    if (!existingTask) {
      await prisma.task.create({
        data: {
          title: 'Hot website visitor follow-up',
          description: `High-intent website activity reached ${score} points. Last action: ${input.eventType}${input.pageUrl ? ` on ${input.pageUrl}` : ''}.`,
          status: 'Open',
          dueAt: new Date(Date.now() + 15 * 60 * 1000),
          contactId: resolvedContactId,
        },
      })
    }

    const anonymousAlert = await prisma.systemEvent.findFirst({
      where: {
        type: 'visitor.intent.hot',
        leadSessionId: visitorId,
        contactId: null,
      },
      select: { id: true },
    })

    if (anonymousAlert) {
      await prisma.systemEvent.update({
        where: { id: anonymousAlert.id },
        data: { contactId: resolvedContactId },
      })
    }
  }

  if (previousScore < 80 && score >= 80) {
    const existingAlert = await prisma.systemEvent.findFirst({
      where: {
        type: 'visitor.intent.hot',
        leadSessionId: visitorId,
      },
      select: { id: true },
    })

    if (!existingAlert) {
      await prisma.systemEvent.create({
        data: {
          type: 'visitor.intent.hot',
          leadSessionId: visitorId,
          contactId: resolvedContactId ?? undefined,
          source: input.source ?? undefined,
          medium: input.medium ?? undefined,
          campaign: input.campaign ?? undefined,
          payload: {
            visitorId,
            score,
            intentLevel,
            eventType: input.eventType,
            pageUrl: input.pageUrl ?? null,
            productInterest: input.productInterest ?? null,
            county: input.county ?? null,
          },
        },
      })

      void sendGoogleChatMessage(
        `🔥 Hot website visitor\nScore: ${score}\nStatus: ${resolvedContactId ? 'Known contact' : 'Anonymous visitor'}\nLast action: ${input.eventType}${input.pageUrl ? `\nPage: ${input.pageUrl}` : ''}${input.productInterest ? `\nInterest: ${input.productInterest}` : ''}`,
      ).catch((error) => {
        logger.warn({ err: error instanceof Error ? error.message : String(error), visitorId }, 'Hot visitor Google Chat alert failed')
      })
    }
  }

  return {
    score,
    intentLevel,
    contactId: resolvedContactId ?? null,
  }
}

export async function getHotVisitors(limit = 12): Promise<HotVisitorRow[]> {
  const safeLimit = Math.max(1, Math.min(limit, 50))

  return prisma.$queryRaw<HotVisitorRow[]>`
    SELECT
      s.visitor_id AS "visitorId",
      s.score AS "score",
      s.intent_level AS "intentLevel",
      s.last_scored_at AS "lastScoredAt",
      v.last_seen_at AS "lastSeenAt",
      v.source AS "source",
      v.medium AS "medium",
      v.campaign AS "campaign",
      v.landing_page AS "landingPage",
      v.county AS "county",
      v.product_interest AS "productInterest",
      COALESCE(s.contact_id, v.contact_id) AS "contactId",
      c."firstName" AS "firstName",
      c."lastName" AS "lastName",
      c.email AS "email",
      c.phone AS "phone",
      last_event.event_type AS "lastEventType",
      last_event.page_url AS "lastPageUrl",
      last_event.occurred_at AS "lastEventAt"
    FROM public."LeadIntentScore" s
    JOIN public."VisitorIdentity" v ON v.visitor_id = s.visitor_id
    LEFT JOIN public."Contact" c ON c.id = COALESCE(s.contact_id, v.contact_id)
    LEFT JOIN LATERAL (
      SELECT event_type, page_url, occurred_at
      FROM public."VisitorIntentEvent" e
      WHERE e.visitor_id = s.visitor_id
      ORDER BY occurred_at DESC
      LIMIT 1
    ) last_event ON true
    WHERE s.score >= 20
    ORDER BY s.score DESC, s.last_scored_at DESC
    LIMIT ${safeLimit}
  `
}
