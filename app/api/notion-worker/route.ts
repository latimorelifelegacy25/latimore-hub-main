import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
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
