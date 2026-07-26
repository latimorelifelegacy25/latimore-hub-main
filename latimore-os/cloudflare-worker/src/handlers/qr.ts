/**
 * QR Code Scan Tracking Handler
 * GET /api/track/qr/:codeId
 * Tracks scan, writes to DB, preserves attribution, and redirects.
 */

import type { Env } from '../index';
import { createSupabaseClient } from '../lib/supabase';
import { redirectResponse, errorResponse } from '../lib/response';
import { hashIP } from '../lib/auth';

const SESSION_ID_PATTERN = /^[A-Za-z0-9._:-]{1,191}$/;

export async function handleQRTrack(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  codeId: string
): Promise<Response> {
  if (!codeId) return errorResponse(400, 'Missing QR code ID');

  const db = createSupabaseClient(env);

  const { data: qrCode, error } = await db
    .from('qr_codes')
    .select('id, destination_url, is_active, utm_source, utm_medium, utm_campaign')
    .eq('code_id', codeId)
    .single();

  if (error || !qrCode) {
    console.error('[QR] Code not found:', codeId, error?.message || 'unknown error');
    return redirectResponse('https://www.latimorelifelegacy.com', 302);
  }

  const qr = qrCode as {
    id: string;
    destination_url: string;
    is_active: boolean;
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
  };

  if (!qr.is_active) {
    return redirectResponse('https://www.latimorelifelegacy.com', 302);
  }

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const userAgent = request.headers.get('User-Agent') || '';
  const referer = request.headers.get('Referer') || '';
  const deviceType = detectDevice(userAgent);

  const destUrl = new URL(qr.destination_url);
  const reqUrl = new URL(request.url);

  if (qr.utm_source && !destUrl.searchParams.has('utm_source')) {
    destUrl.searchParams.set('utm_source', qr.utm_source);
  }
  if (qr.utm_medium && !destUrl.searchParams.has('utm_medium')) {
    destUrl.searchParams.set('utm_medium', qr.utm_medium);
  }
  if (qr.utm_campaign && !destUrl.searchParams.has('utm_campaign')) {
    destUrl.searchParams.set('utm_campaign', qr.utm_campaign);
  }

  reqUrl.searchParams.forEach((value, key) => {
    if (!destUrl.searchParams.has(key)) {
      destUrl.searchParams.set(key, value);
    }
  });

  const requestedSessionId = reqUrl.searchParams.get('lead_session_id')?.trim() || '';
  const sessionId = SESSION_ID_PATTERN.test(requestedSessionId)
    ? requestedSessionId
    : `qr_${crypto.randomUUID()}`;

  destUrl.searchParams.set('lead_session_id', sessionId);

  const source = qr.utm_source || 'PAHS_QR';
  const medium = qr.utm_medium || 'qr';
  const campaign = qr.utm_campaign || 'pahs-2026';
  const occurredAt = new Date().toISOString();
  const landingPage = `${destUrl.pathname}${destUrl.search}`;

  ctx.waitUntil((async () => {
    const [scanResult, sessionResult] = await Promise.all([
      db.from('qr_scans').insert({
        qr_code_id: qr.id,
        ip_address: hashIP(ip),
        user_agent: userAgent.substring(0, 200),
        device_type: deviceType,
        referrer: referer.substring(0, 500),
        metadata: {
          codeId,
          destination: destUrl.toString(),
          source,
          medium,
          campaign,
          leadSessionId: sessionId,
        },
      }),
      db.from('LeadSession').upsert({
        id: sessionId,
        updatedAt: occurredAt,
        firstSeenAt: occurredAt,
        lastSeenAt: occurredAt,
        landingPage,
        referrer: referer.substring(0, 500) || null,
        source,
        medium,
        campaign,
      }, { onConflict: 'id' }),
    ]);

    if (scanResult.error) {
      console.error('[QR] Failed to persist qr_scans row:', scanResult.error.message);
    }

    if (sessionResult.error) {
      console.error('[QR] Failed to persist LeadSession:', sessionResult.error.message);
      return;
    }

    const eventResult = await db.from('Event').insert({
      id: crypto.randomUUID(),
      eventType: 'cta_click',
      leadSessionId: sessionId,
      pageUrl: landingPage,
      referrer: referer.substring(0, 500) || null,
      source,
      medium,
      campaign,
      occurredAt,
      metadata: {
        channel: 'qr',
        action: 'qr_scan',
        qrCodeId: codeId,
        qrCodeRecordId: qr.id,
        deviceType,
        destination: destUrl.toString(),
      },
    });

    if (eventResult.error) {
      console.error('[QR] Failed to persist canonical Event:', eventResult.error.message);
    }
  })());

  console.log(`[QR] Scan: ${codeId} → ${destUrl.toString()} (${deviceType}, ${sessionId})`);

  return redirectResponse(destUrl.toString(), 302);
}

function detectDevice(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipod/.test(ua)) return 'mobile';
  if (/tablet|ipad/.test(ua)) return 'tablet';
  return 'desktop';
}
