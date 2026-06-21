import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const dynamic = "force-dynamic";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

function toNumber(value: unknown): number {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return 0;
}

export async function GET() {
  try {
    const rows = await prisma.$queryRaw<
      Array<{
        total_contacts: bigint;
        real_contacts: bigint;
        test_contacts: bigint;
        total_inquiries: bigint;
        real_inquiries: bigint;
        test_inquiries: bigint;
        total_appointments: bigint;
        real_appointments: bigint;
        test_appointments: bigint;
        future_real_appointments: bigint;
        lead_sessions: bigint;
        events: bigint;
        page_views: bigint;
        booking_clicks: bigint;
        form_submits: bigint;
        lead_created_events: bigint;
        pahs_sessions: bigint;
        pahs_events: bigint;
      }>
    >`
      with test_contacts as (
        select id
        from public."Contact"
        where lower(coalesce("firstName", '')) in ('robbin','test')
           or lower(coalesce("lastName", '')) in ('unnold','test')
           or lower(coalesce(email, '')) like '%yopmail%'
           or lower(coalesce(email, '')) like '%test%'
           or regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g') in ('7176152613','12485359133')
      )
      select
        (select count(*) from public."Contact") as total_contacts,
        (select count(*) from public."Contact" where id not in (select id from test_contacts)) as real_contacts,
        (select count(*) from public."Contact" where id in (select id from test_contacts)) as test_contacts,

        (select count(*) from public."Inquiry") as total_inquiries,
        (select count(*) from public."Inquiry" where "contactId" not in (select id from test_contacts)) as real_inquiries,
        (select count(*) from public."Inquiry" where "contactId" in (select id from test_contacts)) as test_inquiries,

        (select count(*) from public."Appointment") as total_appointments,
        (select count(*) from public."Appointment" where "contactId" not in (select id from test_contacts)) as real_appointments,
        (select count(*) from public."Appointment" where "contactId" in (select id from test_contacts)) as test_appointments,
        (select count(*) from public."Appointment" where "scheduledFor" >= now() and "contactId" not in (select id from test_contacts)) as future_real_appointments,

        (select count(*) from public."LeadSession") as lead_sessions,
        (select count(*) from public."Event") as events,
        (select count(*) from public."Event" where "eventType" = 'page_view') as page_views,
        (select count(*) from public."Event" where "eventType" = 'book_click') as booking_clicks,
        (select count(*) from public."Event" where "eventType" = 'form_submit') as form_submits,
        (select count(*) from public."Event" where "eventType" = 'lead_created') as lead_created_events,

        (select count(*) from public."LeadSession" where source = 'pahs' or campaign = 'football2026') as pahs_sessions,
        (select count(*) from public."Event" where source = 'pahs' or campaign = 'football2026') as pahs_events
    `;

    const r = rows[0];

    const metrics = {
      totalContacts: toNumber(r.total_contacts),
      realContacts: toNumber(r.real_contacts),
      testContacts: toNumber(r.test_contacts),

      totalInquiries: toNumber(r.total_inquiries),
      realInquiries: toNumber(r.real_inquiries),
      testInquiries: toNumber(r.test_inquiries),

      totalAppointments: toNumber(r.total_appointments),
      realAppointments: toNumber(r.real_appointments),
      testAppointments: toNumber(r.test_appointments),
      futureRealAppointments: toNumber(r.future_real_appointments),

      leadSessions: toNumber(r.lead_sessions),
      events: toNumber(r.events),
      pageViews: toNumber(r.page_views),
      bookingClicks: toNumber(r.booking_clicks),
      formSubmits: toNumber(r.form_submits),
      leadCreatedEvents: toNumber(r.lead_created_events),

      pahsSessions: toNumber(r.pahs_sessions),
      pahsEvents: toNumber(r.pahs_events),
    };

    return NextResponse.json({
      ok: true,
      source: "Latimore-hub Supabase CRM",
      generatedAt: new Date().toISOString(),
      metrics,
    });
  } catch (error) {
    console.error("[pahs-metrics]", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to load PAHS CRM metrics",
      },
      { status: 500 }
    );
  }
}
