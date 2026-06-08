export function buildTrackingUrl(base: string, utm: string | null) {
  if (!utm) return base
  const url = new URL(base)
  url.searchParams.set('utm_source', utm)
  return url.toString()
}
