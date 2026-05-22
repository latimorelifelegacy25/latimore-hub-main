import crypto from 'crypto'
import { NormalizedSocialLead, readFieldValue, splitName } from './types'

export function verifyMetaSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.META_APP_SECRET
  if (!secret) return false
  if (!signature) return false
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    return false
  }
}

export async function fetchMetaLead(
  leadgenId: string,
  pageAccessToken?: string
): Promise<Record<string, unknown>> {
  const token = pageAccessToken || process.env.META_PAGE_ACCESS_TOKEN
  if (!token) throw new Error('META_PAGE_ACCESS_TOKEN not configured')
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${leadgenId}?fields=field_data,created_time,ad_id,adset_id,campaign_id,form_id&access_token=${token}`
  )
  if (!res.ok) throw new Error(`Meta Graph API ${res.status}`)
  return res.json()
}

export function normalizeMetaLead(
  raw: Record<string, unknown>,
  platform: 'facebook' | 'instagram' = 'facebook'
): NormalizedSocialLead {
  const fields = (raw.field_data as Array<{ name: string; values: string[] }>) ?? []
  const fullName = readFieldValue(fields, 'name') || readFieldValue(fields, 'full_name')
  const { firstName, lastName } = splitName(fullName)

  return {
    platform,
    externalLeadId: String(raw.id ?? ''),
    firstName: firstName || readFieldValue(fields, 'first_name'),
    lastName: lastName || readFieldValue(fields, 'last_name'),
    fullName: fullName || undefined,
    email: readFieldValue(fields, 'email') || undefined,
    phone: readFieldValue(fields, 'phone') || readFieldValue(fields, 'phone_number') || undefined,
    city: readFieldValue(fields, 'city') || undefined,
    state: readFieldValue(fields, 'state') || undefined,
    county: readFieldValue(fields, 'county') || undefined,
    productInterest: readFieldValue(fields, 'product') || readFieldValue(fields, 'interest') || undefined,
    formId: String(raw.form_id ?? ''),
    adId: String(raw.ad_id ?? ''),
    campaignId: String(raw.campaign_id ?? ''),
    raw: raw as Record<string, unknown>,
  }
}
