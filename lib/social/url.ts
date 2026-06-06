export function appendUtmParams(
  rawUrl: string | null | undefined,
  params: {
    source?: string
    medium?: string
    campaign?: string
    content?: string
  },
): string | null {
  if (!rawUrl) return null

  try {
    const url = new URL(rawUrl)

    if (params.source) url.searchParams.set('utm_source', params.source)
    if (params.medium) url.searchParams.set('utm_medium', params.medium)
    if (params.campaign) url.searchParams.set('utm_campaign', params.campaign)
    if (params.content) url.searchParams.set('utm_content', params.content)

    return url.toString()
  } catch {
    return rawUrl
  }
}
