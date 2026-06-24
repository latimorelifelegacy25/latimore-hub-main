/**
 * QR Code Scan Tracking Handler
 * GET /api/track/qr/:codeId
 * Tracks scan, writes to DB, redirects to destination
 */

import type { Env } from '../index';
import { createSupabaseClient } from '../lib/supabase';
import { redirectResponse, errorResponse } from '../lib/response';
import { hashIP } from '../lib/auth';

export async function handleQRTrack(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  codeId: string
): Promise<Response> {
  if (!codeId) return errorResponse(400, 'Missing QR code ID');

  const db = createSupabaseClient(env);

  // Look up QR code
  const { data: qrCode, error } = await db
    .from('qr_codes')
    .select('id, destination_url, is_active, utm_source, utm_medium, utm_campaign')
    .eq('code_id', codeId)
    .single();

  if (error || !qrCode) {
    console.error('[QR] Code not found:', codeId);
    // Redirect to homepage as fallback
    return redirectResponse('https://latimorelifelegacy.com', 302);
  }

  const qr = qrCode as {
    id: string;
    destination_url: string;
    is_active: boolean;
    utm_source: string;
    utm_medium: string;
    utm_campaign: string;
  };

  if (!qr.is_active) {
    return redirectResponse('https://latimorelifelegacy.com', 302);
  }

  // Parse request metadata
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const userAgent = request.headers.get('User-Agent') || '';
  const referer = request.headers.get('Referer') || '';
  const deviceType = detectDevice(userAgent);

  // Write scan record asynchronously (don't block redirect)
  ctx.waitUntil(
    db.from('qr_scans').insert({
      qr_code_id: qr.id,
      ip_address: hashIP(ip),
      user_agent: userAgent.substring(0, 200),
      device_type: deviceType,
      referrer: referer.substring(0, 500),
    })
  );

  // Build destination URL with UTM params
  const destUrl = new URL(qr.destination_url);
  const reqUrl = new URL(request.url);

  // Preserve any UTM params from the QR code definition
  if (qr.utm_source && !destUrl.searchParams.has('utm_source')) {
    destUrl.searchParams.set('utm_source', qr.utm_source);
  }
  if (qr.utm_medium && !destUrl.searchParams.has('utm_medium')) {
    destUrl.searchParams.set('utm_medium', qr.utm_medium);
  }
  if (qr.utm_campaign && !destUrl.searchParams.has('utm_campaign')) {
    destUrl.searchParams.set('utm_campaign', qr.utm_campaign);
  }

  // Pass through any additional query params from the scan URL
  reqUrl.searchParams.forEach((value, key) => {
    if (!destUrl.searchParams.has(key)) {
      destUrl.searchParams.set(key, value);
    }
  });

  console.log(`[QR] Scan: ${codeId} → ${destUrl.toString()} (${deviceType})`);

  return redirectResponse(destUrl.toString(), 302);
}

function detectDevice(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipod/.test(ua)) return 'mobile';
  if (/tablet|ipad/.test(ua)) return 'tablet';
  return 'desktop';
}