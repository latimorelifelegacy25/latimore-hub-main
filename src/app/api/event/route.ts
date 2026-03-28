import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EventType, ProductInterest } from '@prisma/client';
import { withCors, handleOptions } from '@/lib/hub/cors';
import { extractAttribution } from '@/lib/hub/extract-attribution';
import { ingestEvent } from '@/lib/hub/ingest-event';
import { randomUUID } from 'crypto';

export { handleOptions as OPTIONS };

const VALID_EVENT_TYPES = new Set(Object.values(EventType));
const VALID_PRODUCTS = new Set(Object.values(ProductInterest));

export const POST = withCors(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { eventType, pageUrl, leadSessionId, metadata } = body;
    if (!eventType || !VALID_EVENT_TYPES.has(eventType)) {
      return NextResponse.json({ ok: false, error: 'Invalid or missing eventType' }, { status: 400 });
    }
    const attr = extractAttribution(body);
    let sessionId = leadSessionId as string | undefined;
    if (sessionId) {
      const existing = await prisma.leadSession.findUnique({ where: { id: sessionId }, select: { id: true } });
      if (!existing) sessionId = undefined;
    }
    if (!sessionId) {
      const session = await prisma.leadSession.create({
        data: {
          id: randomUUID(),
          firstSeenAt: new Date(), lastSeenAt: new Date(),
          source: attr.source ?? undefined, medium: attr.medium ?? undefined,
          campaign: attr.campaign ?? undefined, term: attr.term ?? undefined,
          content: attr.content ?? undefined, referrer: attr.referrer ?? undefined,
          landingPage: attr.landingPage ?? undefined, county: attr.county ?? undefined,
        },
        select: { id: true },
      });
      sessionId = session.id;
    } else {
      await prisma.leadSession.update({ where: { id: sessionId }, data: { lastSeenAt: new Date() } });
    }
    const productInterest = body.productInterest && VALID_PRODUCTS.has(body.productInterest)
      ? body.productInterest as ProductInterest : undefined;
    const event = await ingestEvent({ eventType, leadSessionId: sessionId, pageUrl, referrer: attr.referrer, source: attr.source, medium: attr.medium, campaign: attr.campaign, county: attr.county, productInterest, metadata });
    return NextResponse.json({ ok: true, eventId: event.id, sessionId });
  } catch (err) {
    console.error('[POST /api/event]', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
});
