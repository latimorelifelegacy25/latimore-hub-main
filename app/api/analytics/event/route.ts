import { after, NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

const BOT_UA = /bot|crawler|spider|prerender|lighthouse|headless/i;
const MAX_BODY_BYTES = 8192;
const MAX_METADATA_BYTES = 2048;

async function readBoundedBody(req: NextRequest): Promise<string | null> {
  const reader = req.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder();
  let size = 0;
  let text = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel();
      return null;
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}

function clamp(value: unknown, max = 200): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function sanitizeMetadata(value: unknown): Record<string, string | number | boolean | null> | null {
  if (value == null) return {};
  if (typeof value !== "object" || Array.isArray(value)) return null;
  const entries = Object.entries(value).slice(0, 25);
  const metadata: Record<string, string | number | boolean | null> = {};
  for (const [key, item] of entries) {
    const safeKey = clamp(key, 40);
    if (!safeKey || safeKey === "client_id") continue;
    if (typeof item === "string") metadata[safeKey] = clamp(item) ?? "";
    else if (typeof item === "number" && Number.isFinite(item)) metadata[safeKey] = item;
    else if (typeof item === "boolean" || item === null) metadata[safeKey] = item;
  }
  return Buffer.byteLength(JSON.stringify(metadata), "utf8") <= MAX_METADATA_BYTES ? metadata : null;
}

type AnalyticsPayload = {
  event_name?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  page_path?: string;
  lead_id?: string;
  client_id?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

function cleanEventName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .slice(0, 40);
}

async function sendToGa4(payload: Required<Pick<AnalyticsPayload, "event_name">> & AnalyticsPayload) {
  const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;

  if (!measurementId || !apiSecret) return;

  await fetch(
    `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
    {
      signal: AbortSignal.timeout(3000),
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: payload.client_id || "latimore-os-server",
        events: [
          {
            name: cleanEventName(payload.event_name),
            params: {
              source: payload.source,
              medium: payload.medium,
              campaign: payload.campaign,
              page_path: payload.page_path,
              lead_id: payload.lead_id,
              ...(payload.metadata || {}),
            },
          },
        ],
      }),
    }
  );
}

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, 'event')
  if (limited) return limited

  if (BOT_UA.test(req.headers.get("user-agent") ?? "")) {
    return NextResponse.json({ success: true, filtered: true }, { status: 202 });
  }

  try {
    const contentLength = Number(req.headers.get("content-length") ?? 0);
    if (contentLength > MAX_BODY_BYTES) return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    const raw = await readBoundedBody(req);
    if (raw === null) return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    let body: AnalyticsPayload;
    try {
      body = JSON.parse(raw) as AnalyticsPayload;
    } catch {
      return NextResponse.json({ error: "Malformed JSON body" }, { status: 400 });
    }

    if (!body || typeof body !== "object" || Array.isArray(body) || !clamp(body.event_name, 40)) {
      return NextResponse.json({ error: "Missing event_name" }, { status: 400 });
    }

    const eventName = cleanEventName(clamp(body.event_name, 40)!);
    if (!eventName) return NextResponse.json({ error: "Invalid event_name" }, { status: 400 });
    const metadata = sanitizeMetadata(body.metadata);
    if (!metadata) return NextResponse.json({ error: "Invalid or oversized metadata" }, { status: 400 });
    const clientId = clamp(body.client_id);
    if (clientId) metadata.client_id = clientId;
    if (Buffer.byteLength(JSON.stringify(metadata), "utf8") > MAX_METADATA_BYTES) {
      return NextResponse.json({ error: "Oversized metadata" }, { status: 400 });
    }
    if (body.lead_id && (typeof body.lead_id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.lead_id))) {
      return NextResponse.json({ error: "Invalid lead_id" }, { status: 400 });
    }

    const record = {
      event_name: eventName,
      source: clamp(body.source),
      medium: clamp(body.medium),
      campaign: clamp(body.campaign),
      page_path: clamp(body.page_path, 500),
      lead_id: body.lead_id || null,
      metadata,
    };

    if (!supabase) return NextResponse.json({ error: "Analytics storage unavailable" }, { status: 503 });
    const { error } = await supabase.from("analytics_events").insert(record);
    if (error) {
      return NextResponse.json({ error: "Analytics insert failed" }, { status: 500 });
    }

    // Next.js keeps this work alive after the response; a bare unawaited fetch can be dropped.
    after(async () => {
      try {
        await sendToGa4({
          event_name: eventName,
          source: record.source ?? undefined,
          medium: record.medium ?? undefined,
          campaign: record.campaign ?? undefined,
          page_path: record.page_path ?? undefined,
          lead_id: record.lead_id ?? undefined,
          client_id: clientId ?? undefined,
          metadata,
        });
      } catch {
        // GA4 is optional; first-party storage has already succeeded.
      }
    });

    return NextResponse.json({ success: true, event_name: eventName });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Analytics event failed", details: message },
      { status: 500 }
    );
  }
}
