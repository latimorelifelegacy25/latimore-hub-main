export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { encryptToken } from "@/lib/crypto";

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL;
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");
  const state = req.nextUrl.searchParams.get("state");
  const cookieState = req.cookies.get("ga4_oauth_state")?.value;

  if (!baseUrl) {
    return NextResponse.json(
      { error: "NEXTAUTH_URL is not configured" },
      { status: 500 }
    );
  }

  const stateBuf = Buffer.from(state ?? "");
  const cookieBuf = Buffer.from(cookieState ?? "");
  const stateValid =
    !!state &&
    !!cookieState &&
    stateBuf.length === cookieBuf.length &&
    timingSafeEqual(stateBuf, cookieBuf);

  function redirectAndClearState(url: string) {
    const response = NextResponse.redirect(url);
    response.cookies.delete("ga4_oauth_state");
    return response;
  }

  if (!stateValid) {
    return redirectAndClearState(
      `${baseUrl}/admin/settings/analytics?error=invalid_state`
    );
  }

  if (error) {
    await prisma.systemEvent.create({
      data: {
        type: "GA4_CONNECT_FAILED",
        occurredAt: new Date(),
        payload: {
          error,
          source: "google_oauth_callback",
        },
      },
    });

    return redirectAndClearState(
      `${baseUrl}/admin/settings/analytics?error=oauth_denied`
    );
  }

  if (!code) {
    return redirectAndClearState(
      `${baseUrl}/admin/settings/analytics?error=no_code`
    );
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${baseUrl}/api/analytics/ga4/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const tokenError = await tokenRes.text();

      await prisma.systemEvent.create({
        data: {
          type: "GA4_CONNECT_FAILED",
          occurredAt: new Date(),
          payload: {
            status: tokenRes.status,
            error: tokenError,
          },
        },
      });

      return redirectAndClearState(
        `${baseUrl}/admin/settings/analytics?error=token_exchange_failed`
      );
    }

    const tokens = await tokenRes.json();

    if (!tokens.refresh_token) {
      await prisma.systemEvent.create({
        data: {
          type: "GA4_CONNECT_FAILED",
          occurredAt: new Date(),
          payload: {
            reason: "no_refresh_token",
            connected_at: new Date().toISOString(),
          },
        },
      });

      return redirectAndClearState(
        `${baseUrl}/admin/settings/analytics?error=no_refresh_token`
      );
    }

    // TODO: move to a dedicated integration/settings table instead of an event log.
    await prisma.systemEvent.create({
      data: {
        type: "GA4_CONNECTED",
        occurredAt: new Date(),
        payload: {
          refresh_token: encryptToken(tokens.refresh_token),
          connected_at: new Date().toISOString(),
        },
      },
    });

    return redirectAndClearState(
      `${baseUrl}/admin/settings/analytics?success=true`
    );
  } catch (err) {
    await prisma.systemEvent.create({
      data: {
        type: "GA4_CONNECT_FAILED",
        occurredAt: new Date(),
        payload: {
          error: err instanceof Error ? err.message : "Unknown error",
        },
      },
    });

    return redirectAndClearState(
      `${baseUrl}/admin/settings/analytics?error=unexpected_error`
    );
  }
}
