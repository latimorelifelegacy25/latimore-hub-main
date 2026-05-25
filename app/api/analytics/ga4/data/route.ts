/* =========================================================
   1) prisma/schema.prisma
   =========================================================

model AnalyticsIntegration {
  id           String   @id @default(cuid())
  provider     String   @unique
  propertyId   String?
  refreshToken String
  connectedAt  DateTime
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model SystemEvent {
  id         String   @id @default(cuid())
  type       String
  occurredAt DateTime @default(now())
  payload    Json?
  createdAt  DateTime @default(now())
}

Run:
npx prisma migrate dev --name add_analytics_integration

Required env:

NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GA4_PROPERTY_ID=123456789
ENCRYPTION_KEY=your-32-byte-base64-encryption-key

Generate ENCRYPTION_KEY:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

*/


/* =========================================================
   2) src/lib/prisma.ts
   ========================================================= */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}


/* =========================================================
   3) src/lib/crypto.ts
   ========================================================= */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error("ENCRYPTION_KEY is not configured");
  }

  const buffer = Buffer.from(key, "base64");

  if (buffer.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be a 32-byte base64 string");
  }

  return buffer;
}

export function encryptSecret(value: string) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(".");
}

export function decryptSecret(value: string) {
  const key = getEncryptionKey();

  const [ivBase64, authTagBase64, encryptedBase64] = value.split(".");

  if (!ivBase64 || !authTagBase64 || !encryptedBase64) {
    throw new Error("Invalid encrypted secret format");
  }

  const iv = Buffer.from(ivBase64, "base64");
  const authTag = Buffer.from(authTagBase64, "base64");
  const encrypted = Buffer.from(encryptedBase64, "base64");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}


/* =========================================================
   4) src/app/api/analytics/ga4/auth/route.ts
   ========================================================= */

import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const baseUrl = process.env.NEXTAUTH_URL;

  if (!clientId || !baseUrl) {
    return NextResponse.json(
      { error: "Google OAuth is not configured" },
      { status: 500 }
    );
  }

  const redirectUri = `${baseUrl}/api/analytics/ga4/callback`;
  const scope = "https://www.googleapis.com/auth/analytics.readonly";
  const state = crypto.randomBytes(32).toString("hex");

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");

  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scope);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("state", state);

  const response = NextResponse.json({
    authUrl: authUrl.toString(),
  });

  response.cookies.set("ga4_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });

  return response;
}


/* =========================================================
   5) src/app/api/analytics/ga4/callback/route.ts
   ========================================================= */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encryptSecret } from "@/lib/crypto";

type GoogleTokenResponse = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

function redirectToAnalyticsSettings(params: Record<string, string>) {
  const baseUrl = process.env.NEXTAUTH_URL;

  if (!baseUrl) {
    throw new Error("NEXTAUTH_URL is not configured");
  }

  const url = new URL("/admin/settings/analytics", baseUrl);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return NextResponse.redirect(url.toString());
}

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const propertyId = process.env.GA4_PROPERTY_ID;

  if (!baseUrl || !clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Google OAuth is not configured" },
      { status: 500 }
    );
  }

  const code = req.nextUrl.searchParams.get("code");
  const returnedState = req.nextUrl.searchParams.get("state");
  const googleError = req.nextUrl.searchParams.get("error");
  const storedState = req.cookies.get("ga4_oauth_state")?.value;

  if (googleError) {
    await prisma.systemEvent.create({
      data: {
        type: "GA4_CONNECT_FAILED",
        occurredAt: new Date(),
        payload: {
          error: googleError,
          source: "google_oauth_callback",
        },
      },
    });

    const response = redirectToAnalyticsSettings({
      error: "oauth_denied",
    });

    response.cookies.delete("ga4_oauth_state");

    return response;
  }

  if (!returnedState || !storedState || returnedState !== storedState) {
    await prisma.systemEvent.create({
      data: {
        type: "GA4_CONNECT_FAILED",
        occurredAt: new Date(),
        payload: {
          error: "invalid_state",
        },
      },
    });

    const response = redirectToAnalyticsSettings({
      error: "invalid_state",
    });

    response.cookies.delete("ga4_oauth_state");

    return response;
  }

  if (!code) {
    const response = redirectToAnalyticsSettings({
      error: "no_code",
    });

    response.cookies.delete("ga4_oauth_state");

    return response;
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${baseUrl}/api/analytics/ga4/callback`,
        grant_type: "authorization_code",
      }),
    });

    const tokens = (await tokenRes.json()) as GoogleTokenResponse;

    if (!tokenRes.ok) {
      await prisma.systemEvent.create({
        data: {
          type: "GA4_CONNECT_FAILED",
          occurredAt: new Date(),
          payload: {
            status: tokenRes.status,
            error: tokens.error,
            error_description: tokens.error_description,
          },
        },
      });

      const response = redirectToAnalyticsSettings({
        error: "token_exchange_failed",
      });

      response.cookies.delete("ga4_oauth_state");

      return response;
    }

    if (!tokens.refresh_token) {
      await prisma.systemEvent.create({
        data: {
          type: "GA4_CONNECT_FAILED",
          occurredAt: new Date(),
          payload: {
            reason: "no_refresh_token",
          },
        },
      });

      const response = redirectToAnalyticsSettings({
        error: "no_refresh_token",
      });

      response.cookies.delete("ga4_oauth_state");

      return response;
    }

    const encryptedRefreshToken = encryptSecret(tokens.refresh_token);

    await prisma.analyticsIntegration.upsert({
      where: {
        provider: "GA4",
      },
      update: {
        refreshToken: encryptedRefreshToken,
        propertyId: propertyId ?? null,
        connectedAt: new Date(),
      },
      create: {
        provider: "GA4",
        refreshToken: encryptedRefreshToken,
        propertyId: propertyId ?? null,
        connectedAt: new Date(),
      },
    });

    await prisma.systemEvent.create({
      data: {
        type: "GA4_CONNECTED",
        occurredAt: new Date(),
        payload: {
          provider: "GA4",
          connected_at: new Date().toISOString(),
        },
      },
    });

    const response = redirectToAnalyticsSettings({
      success: "true",
    });

    response.cookies.delete("ga4_oauth_state");

    return response;
  } catch (error) {
    await prisma.systemEvent.create({
      data: {
        type: "GA4_CONNECT_FAILED",
        occurredAt: new Date(),
        payload: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      },
    });

    const response = redirectToAnalyticsSettings({
      error: "unexpected_error",
    });

    response.cookies.delete("ga4_oauth_state");

    return response;
  }
}


/* =========================================================
   6) src/app/api/analytics/ga4/report/route.ts
   ========================================================= */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/crypto";

type GoogleRefreshTokenResponse = {
  access_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

type GaRunReportResponse = {
  dimensionHeaders?: Array<{ name: string }>;
  metricHeaders?: Array<{ name: string; type: string }>;
  rows?: Array<{
    dimensionValues?: Array<{ value: string }>;
    metricValues?: Array<{ value: string }>;
  }>;
  rowCount?: number;
  metadata?: unknown;
  kind?: string;
  error?: unknown;
};

async function getAccessToken(refreshToken: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials are not configured");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });

  const data = (await res.json()) as GoogleRefreshTokenResponse;

  if (!res.ok) {
    throw new Error(
      data.error_description ||
        data.error ||
        `Failed to refresh Google access token. Status: ${res.status}`
    );
  }

  if (!data.access_token) {
    throw new Error("Google token response did not include an access token");
  }

  return data.access_token;
}

function formatGaDate(value: string) {
  if (!/^\d{8}$/.test(value)) {
    return value;
  }

  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

function transformGaRows(gaData: GaRunReportResponse) {
  return (
    gaData.rows?.map((row) => {
      const date = row.dimensionValues?.[0]?.value ?? "";

      return {
        date: formatGaDate(date),
        sessions: Number(row.metricValues?.[0]?.value ?? 0),
        activeUsers: Number(row.metricValues?.[1]?.value ?? 0),
        screenPageViews: Number(row.metricValues?.[2]?.value ?? 0),
      };
    }) ?? []
  );
}

export async function GET() {
  try {
    const integration = await prisma.analyticsIntegration.findUnique({
      where: {
        provider: "GA4",
      },
    });

    if (!integration) {
      return NextResponse.json(
        { error: "GA4 not connected" },
        { status: 401 }
      );
    }

    const propertyId = integration.propertyId || process.env.GA4_PROPERTY_ID;

    if (!propertyId) {
      return NextResponse.json(
        { error: "GA4 property ID is not configured" },
        { status: 500 }
      );
    }

    const refreshToken = decryptSecret(integration.refreshToken);
    const accessToken = await getAccessToken(refreshToken);

    const gaRes = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dateRanges: [
            {
              startDate: "30daysAgo",
              endDate: "today",
            },
          ],
          metrics: [
            {
              name: "sessions",
            },
            {
              name: "activeUsers",
            },
            {
              name: "screenPageViews",
            },
          ],
          dimensions: [
            {
              name: "date",
            },
          ],
          orderBys: [
            {
              dimension: {
                dimensionName: "date",
              },
            },
          ],
        }),
      }
    );

    const gaData = (await gaRes.json()) as GaRunReportResponse;

    if (!gaRes.ok) {
      return NextResponse.json(
        {
          error: "Failed to fetch GA4 report",
          details: gaData,
        },
        { status: gaRes.status }
      );
    }

    return NextResponse.json({
      ok: true,
      provider: "GA4",
      propertyId,
      range: {
        startDate: "30daysAgo",
        endDate: "today",
      },
      data: transformGaRows(gaData),
      raw: gaData,
    });
  } catch (error) {
    console.error("GA4 report error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected GA4 report error",
      },
      { status: 500 }
    );
  }
}


/* =========================================================
   7) src/app/api/analytics/ga4/status/route.ts
   ========================================================= */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const integration = await prisma.analyticsIntegration.findUnique({
    where: {
      provider: "GA4",
    },
    select: {
      provider: true,
      propertyId: true,
      connectedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    connected: Boolean(integration),
    integration,
  });
}


/* =========================================================
   8) src/app/api/analytics/ga4/disconnect/route.ts
   ========================================================= */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  await prisma.analyticsIntegration.deleteMany({
    where: {
      provider: "GA4",
    },
  });

  await prisma.systemEvent.create({
    data: {
      type: "GA4_DISCONNECTED",
      occurredAt: new Date(),
      payload: {
        provider: "GA4",
        disconnected_at: new Date().toISOString(),
      },
    },
  });

  return NextResponse.json({
    ok: true,
  });
}


/* =========================================================
   9) components/ConnectGa4Button.tsx
   ========================================================= */

"use client";

import { useState } from "react";

export function ConnectGa4Button() {
  const [loading, setLoading] = useState(false);

  async function connect() {
    setLoading(true);

    try {
      const res = await fetch("/api/analytics/ga4/auth");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to start GA4 connection");
      }

      window.location.href = data.authUrl;
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <button type="button" onClick={connect} disabled={loading}>
      {loading ? "Connecting..." : "Connect GA4"}
    </button>
  );
}


/* =========================================================
   10) components/Ga4Dashboard.tsx
   ========================================================= */

"use client";

import { useEffect, useState } from "react";

type Ga4Row = {
  date: string;
  sessions: number;
  activeUsers: number;
  screenPageViews: number;
};

export function Ga4Dashboard() {
  const [data, setData] = useState<Ga4Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReport() {
      try {
        const res = await fetch("/api/analytics/ga4/report");
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || "Failed to load GA4 report");
        }

        setData(json.data || []);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, []);

  if (loading) {
    return <p>Loading analytics...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div>
      <h2>GA4 Analytics</h2>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Sessions</th>
            <th>Active users</th>
            <th>Page views</th>
          </tr>
        </thead>

        <tbody>
          {data.map((row) => (
            <tr key={row.date}>
              <td>{row.date}</td>
              <td>{row.sessions}</td>
              <td>{row.activeUsers}</td>
              <td>{row.screenPageViews}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


/* =========================================================
   11) Example usage in a page/component
   ========================================================= */

import { ConnectGa4Button } from "@/components/ConnectGa4Button";
import { Ga4Dashboard } from "@/components/Ga4Dashboard";

export default function AnalyticsSettingsPage() {
  return (
    <main>
      <h1>Analytics Settings</h1>

      <ConnectGa4Button />

      <hr />

      <Ga4Dashboard />
    </main>
  );
}
