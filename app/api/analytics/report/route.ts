import { NextResponse } from "next/server";
import { BetaAnalyticsDataClient } from "@google-analytics/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function privateKey() {
  return process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
}

function getClient() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const key = privateKey();

  if (!clientEmail || !key) {
    throw new Error("Missing GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY");
  }

  return new BetaAnalyticsDataClient({
    credentials: {
      client_email: clientEmail,
      private_key: key,
    },
  });
}

export async function GET() {
  try {
    const propertyId = process.env.GA4_PROPERTY_ID;

    if (!propertyId) {
      return NextResponse.json({ error: "Missing GA4_PROPERTY_ID" }, { status: 500 });
    }

    const analyticsDataClient = getClient();

    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      dimensions: [{ name: "pagePath" }, { name: "sessionSource" }],
      metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }, { name: "eventCount" }],
      limit: 50,
    });

    const rows = response.rows?.map((row) => ({
      pagePath: row.dimensionValues?.[0]?.value || "(not set)",
      source: row.dimensionValues?.[1]?.value || "(direct)",
      pageViews: Number(row.metricValues?.[0]?.value || 0),
      activeUsers: Number(row.metricValues?.[1]?.value || 0),
      eventCount: Number(row.metricValues?.[2]?.value || 0),
    })) || [];

    return NextResponse.json({ rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "GA4 report failed", details: message }, { status: 500 });
  }
}
