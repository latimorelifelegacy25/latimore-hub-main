export type MarketingContentItem = {
  id: string
  title: string
  bodyHtml: string
  campaign: string | null
  destination: string | null
  utmSource: string | null
  utmMedium: string | null
  utmContent: string | null
  type: string
  status: string
  sourceUrl: string | null
  domain: string | null
  author: string | null
  category: string | null
  coverImageUrl: string | null
  slug: string | null
  fileName: string | null
  fileSizeBytes: number | null
  scheduledFor: string | null
  publishedAt: string | null
  deployId: string | null
  deployStatus: string | null
  deployUrl: string | null
  createdAt: string
  updatedAt: string
}
