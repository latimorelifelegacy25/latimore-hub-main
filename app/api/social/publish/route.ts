import { NextRequest, NextResponse } from 'next/server'
import { requireReviewerRole } from '@/lib/rbac'
import { rateLimit } from '@/lib/rate-limit'
import { SocialPublishSchema } from '@/lib/schemas'
import { logger } from '@/lib/logger'
import { getSocialConnection } from '@/lib/social'
import { decryptToken } from '@/lib/crypto'
import { evaluatePublishGate, publishBlockedBody } from '@/lib/marketing/approval-gate'
import { createGbpTrackingLink } from '@/lib/tracking/social-link'
import { publishViaOneUp } from '@/lib/social/oneup-publisher'
import { auditGate } from '@/lib/marketing/approval-gate-assets'

export const dynamic = 'force-dynamic'

type ProviderKey = 'linkedin' | 'facebook' | 'instagram' | 'twitter' | 'gbp'

type PublishResult = {
  provider: ProviderKey
  ok: boolean
  postId?: string
  status?: 'queued'
  error?: string
}

export async function POST(req: NextRequest) {
  const auth = await requireReviewerRole()
  if (!auth.ok) return auth.response

  const limited = await rateLimit(req, 'adminSend', auth.email ?? undefined)
  if (limited) return limited

  const parsed = SocialPublishSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 422 })
  }
  const { content, imageUrl, linkUrl } = parsed.data
  const gate = evaluatePublishGate({ text: content })
  await auditGate('social_post', null, gate)
  if (!gate.allowed) {
    logger.warn({ route: 'social/publish' }, '[approval-gate] direct publish blocked')
    return NextResponse.json(publishBlockedBody(gate.blockers), { status: 422 })
  }
  const providers = Array.from(new Set(parsed.data.providers)) as ProviderKey[]

  const results: PublishResult[] = await Promise.all(
    providers.map(async (provider): Promise<PublishResult> => {
      try {
        if (provider === 'gbp') {
          const trackedUrl = linkUrl ? await createGbpTrackingLink(linkUrl, { createdBy: auth.email }) : undefined
          const result = await publishViaOneUp('gbp', {
            caption: linkUrl && trackedUrl ? content.replaceAll(linkUrl, trackedUrl) : content,
            linkUrl: trackedUrl,
            mediaUrls: imageUrl ? [imageUrl] : [],
          })
          return { provider, ok: true, postId: result.externalPostId, status: 'queued' }
        }
        const conn = await getSocialConnection(provider as any)
        const accessToken = decryptToken(conn?.accessToken)

        if (!conn?.externalId || !accessToken) {
          return { provider, ok: false, error: `${provider} not connected` }
        }

        switch (provider) {
          case 'facebook': {
            if (imageUrl) {
              const res = await fetch(`https://graph.facebook.com/v19.0/${conn.externalId}/photos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: imageUrl, caption: content, access_token: accessToken }),
              })
              if (!res.ok) return { provider, ok: false, error: `Facebook photo publish failed: ${res.status}` }
              const data = await res.json()
              return { provider, ok: true, postId: data.post_id ?? data.id }
            }
            const payload: Record<string, string> = { message: content, access_token: accessToken }
            if (linkUrl) payload.link = linkUrl
            const res = await fetch(`https://graph.facebook.com/v19.0/${conn.externalId}/feed`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            })
            if (!res.ok) return { provider, ok: false, error: `Facebook publish failed: ${res.status}` }
            const data = await res.json()
            return { provider, ok: true, postId: data.id }
          }

          case 'instagram': {
            if (!imageUrl) return { provider, ok: false, error: 'Instagram requires an imageUrl' }
            const createRes = await fetch(`https://graph.facebook.com/v19.0/${conn.externalId}/media`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image_url: imageUrl, caption: content, access_token: accessToken }),
            })
            if (!createRes.ok) return { provider, ok: false, error: `Instagram media creation failed: ${createRes.status}` }
            const { id: creationId } = await createRes.json()
            const publishRes = await fetch(`https://graph.facebook.com/v19.0/${conn.externalId}/media_publish`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ creation_id: creationId, access_token: accessToken }),
            })
            if (!publishRes.ok) return { provider, ok: false, error: `Instagram publish failed: ${publishRes.status}` }
            const data = await publishRes.json()
            return { provider, ok: true, postId: data.id }
          }

          case 'linkedin': {
            const payload = {
              author: conn.externalId,
              lifecycleState: 'PUBLISHED',
              specificContent: {
                'com.linkedin.ugc.ShareContent': {
                  shareCommentary: { text: content },
                  shareMediaCategory: 'NONE',
                },
              },
              visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
            }
            const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'X-RestLi-Protocol-Version': '2.0.0',
              },
              body: JSON.stringify(payload),
            })
            if (!res.ok) return { provider, ok: false, error: `LinkedIn publish failed: ${res.status}` }
            const data = await res.json()
            return { provider, ok: true, postId: data.id }
          }

          case 'twitter': {
            const res = await fetch('https://api.twitter.com/2/tweets', {
              method: 'POST',
              headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: content }),
            })
            if (!res.ok) return { provider, ok: false, error: `Twitter publish failed: ${res.status}` }
            const data = await res.json()
            return { provider, ok: true, postId: data.data?.id }
          }

          default:
            return { provider, ok: false, error: `Unsupported provider: ${provider}` }
        }
      } catch (err) {
        logger.error({ provider, err: err instanceof Error ? err.message : String(err) }, 'Social publish failed')
        return { provider, ok: false, error: `${provider} publish failed` }
      }
    })
  )

  return NextResponse.json({ ok: true, results })
}
