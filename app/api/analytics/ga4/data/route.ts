import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type GoogleTokenResponse = {
  access_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
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

  const data = (await res.json()) as GoogleTokenResponse;

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

function getRefreshTokenFromPayload(payload: unknown) {
  if (
    !payload ||
    typeof payload !== "object" ||
    !("refresh_token" in payload)
  ) {
    return null;
  }

  const refreshToken = (payload as { refresh_token?: unknown }).refresh_token;

  return typeof refreshToken === "string" && refreshToken.length > 0
    ? refreshToken
    : null;
}

export async function GET() {
  try {
    const propertyId = process.env.GA4_PROPERTY_ID;

    if (!propertyId) {
      return NextResponse.json(
        { error: "GA4_PROPERTY_ID is not configured" },
        { status: 500 }
      );
    }

    const event = await prisma.systemEvent.findFirst({
      where: {
        type: "GA4_CONNECTED",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "GA4 not connected" },
        { status: 401 }
      );
    }

    const refreshToken = getRefreshTokenFromPayload(event.payload);

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Stored GA4 connection is missing a refresh token" },
        { status: 500 }
      );
    }

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
            { name: "sessions" },
            { name: "activeUsers" },
            { name: "screenPageViews" },
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

    const gaData = await gaRes.json();

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
      data: gaData,
    });
  } catch (e) {
    console.error("GA4 report error:", e);

    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Unexpected GA4 report error",
      },
      { status: 500 }
    );
  }
}
