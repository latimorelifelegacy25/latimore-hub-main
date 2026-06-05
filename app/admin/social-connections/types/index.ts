export type ProviderKey = 'linkedin' | 'facebook' | 'instagram' | 'twitter'

export interface ConnectionDraft {
  accountName: string
  externalId: string
  accessToken: string
  refreshToken: string
  tokenExpiresAt: string
  metadata: string
}

export interface SocialConnection {
  id: string
  provider: ProviderKey
  accountName?: string | null
  externalId?: string | null
  accessToken?: string | null
  refreshToken?: string | null
  tokenExpiresAt?: string | null
  metadata?: unknown
  status?: string
  updatedAt: string
}
