import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/ai/shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const workerUrl = process.env.LATIMORE_NOTION_WORKER_URL;

    if (!workerUrl) {
      return NextResponse.json(
        { ok: false, error: "Missing LATIMORE_NOTION_WORKER_URL" },
        { status: 500 }
      );
    }

    const body = await req.json();

    const response = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
