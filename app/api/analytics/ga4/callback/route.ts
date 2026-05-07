import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/admin/settings/analytics?error=no_code`);

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/analytics/ga4/callback`,
      grant_type: "authorization_code",
    }),
  });

  const tokens = await tokenRes.json();
  if (!tokens.refresh_token) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/admin/settings/analytics?error=no_refresh_token`);
  }

  await prisma.systemEvent.create({
    data: {
      type: "GA4_CONNECTED",
      payload: JSON.stringify({ refresh_token: tokens.refresh_token, connected_at: new Date().toISOString() }),
    }
  });

  return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/admin/settings/analytics?success=true`);
}
