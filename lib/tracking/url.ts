export type UtmParams = Partial<{
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  utmTerm: string | null
  utmContent: string | null
}>

const UTM_KEY_MAP = {
  utmSource: 'utm_source',
  utmMedium: 'utm_medium',
  utmCampaign: 'utm_campaign',
  utmTerm: 'utm_term',
  utmContent: 'utm_content',
} as const

export function appendUtmParams(destination: string, params: UtmParams): string {
  const url = new URL(destination)

  for (const [inputKey, queryKey] of Object.entries(UTM_KEY_MAP)) {
    const value = params[inputKey as keyof UtmParams]?.trim()
    if (value) url.searchParams.set(queryKey, value)
  }

  return url.toString()
}
