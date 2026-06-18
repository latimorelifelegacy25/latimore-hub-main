/**
 * Response helpers for Cloudflare Worker
 */

export function corsHeaders(allowedOrigin: string): HeadersInit {
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Worker-Secret',
    'Access-Control-Max-Age': '86400',
  };
}

export function jsonResponse(data: unknown, status = 200, origin?: string): Response {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (origin) {
    Object.assign(headers, corsHeaders(origin));
  }
  return new Response(JSON.stringify(data), { status, headers });
}

export function errorResponse(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message, status }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function redirectResponse(url: string, status = 302): Response {
  return Response.redirect(url, status);
}