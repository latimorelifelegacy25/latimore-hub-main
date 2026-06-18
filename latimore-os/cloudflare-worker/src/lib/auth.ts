/**
 * Auth helpers for Cloudflare Worker
 */

export function verifyWorkerSecret(
  request: Request,
  secret: string
): { valid: boolean; reason?: string } {
  const header = request.headers.get('X-Worker-Secret');
  if (!header) return { valid: false, reason: 'Missing X-Worker-Secret header' };
  if (header !== secret) return { valid: false, reason: 'Invalid secret' };
  return { valid: true };
}

export function verifyFilloutSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // Fillout uses HMAC-SHA256 — verify in production
  // For now, check presence of signature header
  return !!signature && !!secret;
}

export function hashIP(ip: string): string {
  // Simple hash for PII-safe storage — use crypto in production
  return ip ? `hashed_${ip.split('.').slice(0, 2).join('.')}.*.*` : 'unknown';
}