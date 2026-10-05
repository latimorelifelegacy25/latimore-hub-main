import type { SocialPlatform } from './types'

/**
 * Publish social posts through OneUp via the Composio Platform API.
 *
 * Used as the publish path when no native OAuth connection exists for a
 * platform in the hub's Social Connections. OneUp holds the actual social
 * account connections (Facebook page, Instagram, Google Business Profile);
 * Composio brokers the API calls.
 *
 * Required env: COMPOSIO_API_KEY (server-side only, never exposed to client).
 * Optional env overrides: COMPOSIO_ONEUP_ACCOUNT_ID, COMPOSIO_ENTITY_ID,
 * ONEUP_CATEGORY_ID, ONEUP_ACCOUNT_IDS_JSON.
 */

// OneUp social account IDs, verified 2026-10-02 via ONEUP_LIST_CATEGORY_ACCOUNTS
// (category 187970 "Category 1"). Override with ONEUP_ACCOUNT_IDS_JSON.
const DEFAULT_ACCOUNT_IDS: Record<string, string> = {
  facebook: '833640126497062',
  instagram: '17841470937590620',
  gbp: 'accounts/103533849204901000947/locations/13563616071314576110',
}

const COMPOSIO_API_BASE = 'https://backend.composio.dev/api/v3.1'
const DEFAULT_CONNECTED_ACCOUNT_ID = 'ca_NFJKjvqIQvzo'
const DEFAULT_ENTITY_ID = 'jackson_latimore'
const DEFAULT_CATEGORY_ID = 187970

const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.m4v', '.webm', '.avi', '.mkv']

export function isOneUpConfigured(): boolean {
  return Boolean(process.env.COMPOSIO_API_KEY)
}

export function getOneUpSocialAccountId(platform: string): string | null {
  const overrideRaw = process.env.ONEUP_ACCOUNT_IDS_JSON
  if (overrideRaw) {
    try {
      const overrides = JSON.parse(overrideRaw) as Record<string, string>
      const hit = overrides[platform]
      if (typeof hit === 'string' && hit.length > 0) return hit
    } catch {
      // fall through to defaults on malformed JSON
    }
  }
  return DEFAULT_ACCOUNT_IDS[platform] ?? null
}

function getCategoryId(): number {
  const raw = process.env.ONEUP_CATEGORY_ID
  const parsed = raw ? Number.parseInt(raw, 10) : NaN
  return Number.isFinite(parsed) ? parsed : DEFAULT_CATEGORY_ID
}

function isVideoUrl(url: string): boolean {
  const lower = url.split('?')[0].toLowerCase()
  return VIDEO_EXTENSIONS.some(ext => lower.endsWith(ext))
}

/** Current time in America/New_York as "YYYY-MM-DD HH:MM" for OneUp scheduling. */
export function formatOneUpDateTime(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const get = (type: string) => parts.find(p => p.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}`
}

type OneUpToolResult = {
  successful: boolean
  data?: unknown
  error?: string | null
  log_id?: string
}

async function executeOneUpTool(toolSlug: string, args: Record<string, unknown>): Promise<OneUpToolResult> {
  const apiKey = process.env.COMPOSIO_API_KEY
  if (!apiKey) {
    throw new Error('COMPOSIO_API_KEY is not set.')
  }

  const response = await fetch(`${COMPOSIO_API_BASE}/tools/execute/${toolSlug}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      connected_account_id: process.env.COMPOSIO_ONEUP_ACCOUNT_ID ?? DEFAULT_CONNECTED_ACCOUNT_ID,
      entity_id: process.env.COMPOSIO_ENTITY_ID ?? DEFAULT_ENTITY_ID,
      arguments: args,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Composio ${toolSlug} failed (HTTP ${response.status}): ${text.slice(0, 300)}`)
  }

  const result = (await response.json()) as OneUpToolResult
  if (!result.successful) {
    throw new Error(`OneUp ${toolSlug} failed: ${result.error ?? 'unknown error'}`)
  }
  return result
}

export type OneUpPublishInput = {
  caption: string
  linkUrl?: string | null
  mediaUrls?: string[]
  /** When true, saves as a OneUp draft instead of scheduling. Used for safe testing. */
  asDraft?: boolean
  /** Override the scheduled publish time (defaults to now). */
  scheduledAt?: Date
}

export type OneUpPublishResult = {
  platform: SocialPlatform
  externalPostId?: string
  via: 'oneup'
  logId?: string
  raw: unknown
}

export async function publishViaOneUp(
  platform: SocialPlatform,
  input: OneUpPublishInput,
): Promise<OneUpPublishResult> {
  const socialAccountId = getOneUpSocialAccountId(platform)
  if (!socialAccountId) {
    throw new Error(`OneUp has no mapped social account for platform: ${platform}`)
  }

  const mediaUrls = (input.mediaUrls ?? []).filter(u => typeof u === 'string' && u.length > 0)
  const hasVideo = mediaUrls.some(isVideoUrl)
  const images = mediaUrls.filter(u => !isVideoUrl(u))

  const baseArgs: Record<string, unknown> = {
    content: input.linkUrl && !input.caption.includes(input.linkUrl)
      ? `${input.caption}\n\n${input.linkUrl}`
      : input.caption,
    category_id: getCategoryId(),
    social_account_ids: [socialAccountId],
    scheduled_date_time: formatOneUpDateTime(input.scheduledAt),
  }
  if (input.asDraft) {
    baseArgs.is_draft = true
  }

  let toolSlug: string
  if (hasVideo) {
    toolSlug = 'ONEUP_CREATE_VIDEO_POST'
    baseArgs.video_url = mediaUrls.find(isVideoUrl)
  } else if (images.length > 0) {
    toolSlug = 'ONEUP_CREATE_IMAGE_POST'
    baseArgs.image_urls = images
  } else {
    toolSlug = 'ONEUP_CREATE_TEXT_POST'
  }

  const result = await executeOneUpTool(toolSlug, baseArgs)
  const data = (result.data ?? {}) as Record<string, unknown>

  return {
    platform,
    externalPostId:
      typeof data.post_id === 'string'
        ? data.post_id
        : typeof data.id === 'string'
          ? data.id
          : undefined,
    via: 'oneup',
    logId: result.log_id,
    raw: result.data,
  }
}
