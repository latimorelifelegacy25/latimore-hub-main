import type { PublishPayload, PublishResult, PublishTarget } from './types'

const LINKEDIN_VERSION = process.env.LINKEDIN_VERSION ?? '202506'
const LINKEDIN_API_BASE_URL = 'https://api.linkedin.com/rest'

type LinkedInResponse = {
  id?: string
  [key: string]: unknown
}

function assertLinkedInTarget(target: PublishTarget) {
  if (!target.externalId) {
    throw new Error('LinkedIn is missing externalId. Use a member URN like urn:li:person:... or organization URN like urn:li:organization:...')
  }

  if (!target.accessToken) {
    throw new Error('LinkedIn is missing an access token.')
  }
}

export async function publishLinkedInPost(target: PublishTarget, payload: PublishPayload): Promise<PublishResult> {
  assertLinkedInTarget(target)

  const commentary = payload.linkUrl ? `${payload.caption}\n\n${payload.linkUrl}` : payload.caption

  const body: Record<string, unknown> = {
    author: target.externalId,
    commentary,
    visibility: 'PUBLIC',
    distribution: {
      feedDistribution: 'MAIN_FEED',
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: 'PUBLISHED',
    isReshareDisabledByAuthor: false,
  }

  const res = await fetch(`${LINKEDIN_API_BASE_URL}/posts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${target.accessToken}`,
      'Content-Type': 'application/json',
      'Linkedin-Version': LINKEDIN_VERSION,
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(body),
  })

  const rawText = await res.text()
  let json: LinkedInResponse = {}

  try {
    json = rawText ? (JSON.parse(rawText) as LinkedInResponse) : {}
  } catch {
    json = { rawText }
  }

  if (!res.ok) {
    throw new Error(`LinkedIn publish failed with HTTP ${res.status}: ${rawText}`)
  }

  return {
    platform: 'linkedin',
    externalPostId: json.id ?? res.headers.get('x-restli-id') ?? undefined,
    raw: json,
  }
}
