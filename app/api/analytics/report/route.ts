import { NextResponse } from "next/server";
import { createSign } from "crypto";
import { requireAdminSession } from "@/lib/ai/shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parsePrivateKey() {
  return process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n") ?? "";
}

// Module-scope caches (per warm serverless instance)
const TOKEN_TTL_MS = 50 * 60 * 1000
const REPORT_TTL_MS = 10 * 60 * 1000
let cachedToken: { value: string; expiresAt: number } | null = null
const reportCache = new Map<string, { rows: unknown[]; expiresAt: number }>()

async function getServiceAccountToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value

  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = parsePrivateKey();

  if (!clientEmail || !privateKey) {
    throw new Error("Missing GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/analytics.readonly",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  ).toString("base64url");

  const unsigned = `${header}.${payload}`;
  const sign = createSign("RSA-SHA256");
  sign.update(unsigned);
  const signature = sign.sign(privateKey, "base64url");
  const jwt = `${unsigned}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
    signal: AbortSignal.timeout(10000),
  });

  const data = (await res.json()) as { access_token?: string; error?: string };
  if (!res.ok || !data.access_token) {
    throw new Error(data.error ?? "Failed to obtain service account token");
  }

  cachedToken = { value: data.access_token, expiresAt: Date.now() + TOKEN_TTL_MS };
  return data.access_token;
}

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  try {
    const propertyId = process.env.GA4_PROPERTY_ID;
    if (!propertyId) {
      return NextResponse.json({ error: "Missing GA4_PROPERTY_ID" }, { status: 500 });
    }

    const cacheKey = `${propertyId}:30daysAgo:today:50`;
    const cached = reportCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json({ rows: cached.rows });
    }

    const accessToken = await getServiceAccountToken();

    const gaRes = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
          dimensions: [{ name: "pagePath" }, { name: "sessionSource" }],
          metrics: [
            { name: "screenPageViews" },
            { name: "activeUsers" },
            { name: "eventCount" },
          ],
          limit: 50,
        }),
        signal: AbortSignal.timeout(10000),
      }
    );

    const data = (await gaRes.json()) as {
      rows?: Array<{
        dimensionValues?: Array<{ value: string }>;
        metricValues?: Array<{ value: string }>;
      }>;
      error?: unknown;
    };

    if (!gaRes.ok) {
      console.error("[analytics/report] GA4 report failed", data);
      return NextResponse.json({ error: "GA4 report failed" }, { status: gaRes.status });
    }

    const rows =
      data.rows?.map((row) => ({
        pagePath: row.dimensionValues?.[0]?.value || "(not set)",
        source: row.dimensionValues?.[1]?.value || "(direct)",
        pageViews: Number(row.metricValues?.[0]?.value || 0),
        activeUsers: Number(row.metricValues?.[1]?.value || 0),
        eventCount: Number(row.metricValues?.[2]?.value || 0),
      })) ?? [];

    reportCache.set(cacheKey, { rows, expiresAt: Date.now() + REPORT_TTL_MS });
    return NextResponse.json({ rows });
  } catch (error) {
    console.error("[analytics/report] error", error);
    return NextResponse.json({ error: "GA4 report failed" }, { status: 500 });
  }
}
