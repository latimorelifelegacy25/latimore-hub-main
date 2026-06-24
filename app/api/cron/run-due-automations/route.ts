import { NextRequest, NextResponse } from "next/server";
import { runDueAutomations } from "@/lib/automation/crm";
import { requireCronAuth } from "@/lib/ai/shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const unauthorized = requireCronAuth(req);
  if (unauthorized) return unauthorized;

  const body = await req.json().catch(() => ({}));
  const source = body?.source || "cron";

  try {
    const summary = await runDueAutomations(source);
    return NextResponse.json({ ok: true, summary });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const unauthorized = requireCronAuth(req);
  if (unauthorized) return unauthorized;

  return NextResponse.json({
    ok: true,
    route: "/api/cron/run-due-automations",
    status: "ready",
  });
}
