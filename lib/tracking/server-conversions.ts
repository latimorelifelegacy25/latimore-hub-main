import crypto from 'node:crypto'
import { logger } from '@/lib/logger'

type LeadConversionInput = {
  eventId: string
  email?: string | null
  phone?: string | null
  eventSourceUrl?: string | null
  userAgent?: string | null
  ipAddress?: string | null
  source?: string | null
  campaign?: string | null
}

function sha256(value?: string | null) {
  const normalized = value?.trim().toLowerCase()
  if (!normalized) return undefined
  return crypto.createHash('sha256').update(normalized).digest('hex')
}

function normalizePhone(value?: string | null) {
  const digits = value?.replace(/\D/g, '')
  if (!digits) return undefined
  return digits.startsWith('1') ? digits : `1${digits}`
}

export async function sendMetaLeadConversion(input: LeadConversionInput) {
  const pixelId = process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN

  if (!pixelId || !accessToken) return

  const payload = {
    data: [
      {
        event_name: 'Lead',
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        action_source: 'website',
        event_source_url: input.eventSourceUrl ?? undefined,
        user_data: {
          em: sha256(input.email),
          ph: sha256(normalizePhone(input.phone)),
          client_user_agent: input.userAgent ?? undefined,
          client_ip_address: input.ipAddress ?? undefined,
        },
        custom_data: {
          source: input.source ?? undefined,
          campaign: input.campaign ?? undefined,
        },
      },
    ],
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v20.0/${pixelId}/events?access_token=${accessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      logger.warn({ status: response.status, body }, '[meta-capi] Lead conversion rejected')
    }
  } catch (error) {
    logger.warn({ error }, '[meta-capi] Lead conversion failed')
  }
}
