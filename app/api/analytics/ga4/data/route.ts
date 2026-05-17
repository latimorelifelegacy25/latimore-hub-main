import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function getAccessToken(refreshToken: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  return data.access_token;
}

export async function GET() {
  try {
    const event = await prisma.systemEvent.findFirst({
      where: { type: "GA4_CONNECTED" },
      orderBy: { createdAt: "desc" },
    });
    if (!event) return NextResponse.json({ error: "GA4 not connected" }, { status: 401 });

    const payload = event.payload as any;
    const accessToken = await getAccessToken(payload.refresh_token);
    const propertyId = process.env.GA4_PROPERTY_ID!;

    const gaRes = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        metrics: [{ name: "sessions" }, { name: "activeUsers" }, { name: "screenPageViews" }],
        dimensions: [{ name: "date" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      }),
    });

    const gaData = await gaRes.json();
    return NextResponse.json({ ok: true, data: gaData });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
