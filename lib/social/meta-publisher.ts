import type { PublishPayload, PublishResult, PublishTarget } from './types'

const GRAPH_VERSION = process.env.META_GRAPH_VERSION ?? 'v20.0'
const GRAPH_BASE_URL = `https://graph.facebook.com/${GRAPH_VERSION}`

type MetaPublishResponse = {
  id?: string
  post_id?: string
  error?: {
    message?: string
    type?: string
    code?: number
  }
  [key: string]: unknown
}

function assertMetaTarget(target: PublishTarget) {
  if (!target.externalId) {
    throw new Error(`${target.platform} is missing externalId. Use the Facebook Page ID or Instagram Business Account ID.`)
  }

  if (!target.accessToken) {
    throw new Error(`${target.platform} is missing an access token.`)
  }
}

async function postToGraph(path: string, body: URLSearchParams): Promise<MetaPublishResponse> {
  const res = await fetch(`${GRAPH_BASE_URL}/${path}`, {
    method: 'POST',
    body,
  })

  const json = (await res.json()) as MetaPublishResponse

  if (!res.ok || json.error) {
    throw new Error(json.error?.message ?? `Meta publish failed with HTTP ${res.status}`)
  }

  return json
}

export async function publishFacebookPagePost(target: PublishTarget, payload: PublishPayload): Promise<PublishResult> {
  assertMetaTarget(target)

  const body = new URLSearchParams()
  body.set('access_token', target.accessToken as string)
  body.set('message', payload.caption)

  if (payload.linkUrl) {
    body.set('link', payload.linkUrl)
  }

  const mediaUrl = payload.mediaUrls?.[0]
  if (mediaUrl && !payload.linkUrl) {
    body.set('url', mediaUrl)
    body.set('caption', payload.caption)
    const json = await postToGraph(`${target.externalId}/photos`, body)
    return {
      platform: 'facebook',
      externalPostId: json.post_id ?? json.id,
      raw: json,
    }
  }

  const json = await postToGraph(`${target.externalId}/feed`, body)
  return {
    platform: 'facebook',
    externalPostId: json.id,
    raw: json,
  }
}

export async function publishInstagramPost(target: PublishTarget, payload: PublishPayload): Promise<PublishResult> {
  assertMetaTarget(target)

  const imageUrl = payload.mediaUrls?.[0]
  if (!imageUrl) {
    throw new Error('Instagram publishing requires at least one public image URL.')
  }

  const createBody = new URLSearchParams()
  createBody.set('access_token', target.accessToken as string)
  createBody.set('image_url', imageUrl)
  createBody.set('caption', payload.linkUrl ? `${payload.caption}\n\n${payload.linkUrl}` : payload.caption)

  const container = await postToGraph(`${target.externalId}/media`, createBody)
  const creationId = container.id

  if (!creationId) {
    throw new Error('Instagram media container was not created.')
  }

  const publishBody = new URLSearchParams()
  publishBody.set('access_token', target.accessToken as string)
  publishBody.set('creation_id', creationId)

  const json = await postToGraph(`${target.externalId}/media_publish`, publishBody)

  return {
    platform: 'instagram',
    externalPostId: json.id,
    raw: json,
  }
}
