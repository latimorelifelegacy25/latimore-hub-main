import { NextRequest, NextResponse } from 'next/server';
import { ProductInterest } from '@prisma/client';
import { withCors, handleOptions } from '@/lib/hub/cors';
import { upsertLead } from '@/lib/hub/upsert-lead';

export { handleOptions as OPTIONS };

const VALID_PRODUCTS = new Set(Object.values(ProductInterest));

export const POST = withCors(async (req: NextRequest) => {
  try {
    const body = await req.json();
    if (!body.email && !body.phone) {
      return NextResponse.json({ ok: false, error: 'email or phone required' }, { status: 400 });
    }
    const productInterest = body.productInterest && VALID_PRODUCTS.has(body.productInterest)
      ? body.productInterest as ProductInterest : undefined;
    const { contact, inquiry } = await upsertLead({
      firstName: body.firstName, lastName: body.lastName, email: body.email,
      phone: body.phone, county: body.county, productInterest,
      leadSessionId: body.leadSessionId, notes: body.notes,
      source: body.source, medium: body.medium, campaign: body.campaign,
      term: body.term, content: body.content, referrer: body.referrer,
      landingPage: body.landingPage,
    });
    return NextResponse.json({ ok: true, contactId: contact.id, inquiryId: inquiry.id });
  } catch (err) {
    console.error('[POST /api/lead]', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
});
