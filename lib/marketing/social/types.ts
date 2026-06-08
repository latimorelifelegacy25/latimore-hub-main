export type SocialPlatform = 'facebook' | 'instagram' | 'linkedin'

export interface PublishPayload {
  id: string
  title: string
  bodyHtml: string
  url?: string
  imageUrl?: string
}
