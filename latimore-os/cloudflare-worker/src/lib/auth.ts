/**
 * Auth helpers for Cloudflare Worker
 */

// Constant-time string comparison to avoid leaking length/content via timing.
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export function verifyWorkerSecret(
  request: Request,
  secret: string
): { valid: boolean; reason?: string } {
  const header = request.headers.get('X-Worker-Secret');
  if (!header) return { valid: false, reason: 'Missing X-Worker-Secret header' };
  if (!secret || !safeCompare(header, secret)) return { valid: false, reason: 'Invalid secret' };
  return { valid: true };
}

function normalizeSignature(sig: string): string {
  const value = sig.trim();
  const idx = value.indexOf('=');
  if (idx > -1 && value.slice(0, idx).toLowerCase().includes('sha256')) return value.slice(idx + 1).trim();
  return value;
}

// Verifies a Fillout webhook's HMAC-SHA256 signature over the raw request body.
export async function verifyFilloutSignature(
  rawBody: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!secret || !signature) return false;

  try {
    const normalized = normalizeSignature(signature);
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
    const computed = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return safeCompare(computed, normalized);
  } catch {
    return false;
  }
}

export function hashIP(ip: string): string {
  // Simple hash for PII-safe storage — use crypto in production
  return ip ? `hashed_${ip.split('.').slice(0, 2).join('.')}.*.*` : 'unknown';
}