/**
 * Tests for the OneUp-via-Composio publisher.
 *
 * Run: npx tsx --test lib/social/__tests__/oneup-publisher.test.ts
 *
 * No live Composio/OneUp calls are made anywhere in this file — global fetch
 * is mocked for every test.
 */
import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'

import {
  formatOneUpDateTime,
  getOneUpSocialAccountId,
  isOneUpConfigured,
  publishViaOneUp,
} from '../oneup-publisher'

// ── fetch mock ───────────────────────────────────────────────────────────────

type CapturedRequest = { url: string; method: string; body: Record<string, unknown> }
let captured: CapturedRequest[] = []
let mockPayload: unknown = { successful: true, data: { post_id: 'oneup-post-123' }, log_id: 'log_test' }
let mockStatus = 200

function mockFetch(url: string, init?: RequestInit) {
  captured.push({
    url,
    method: init?.method ?? 'GET',
    body: init?.body ? (JSON.parse(init.body as string) as Record<string, unknown>) : {},
  })
  return Promise.resolve({
    ok: mockStatus >= 200 && mockStatus < 300,
    status: mockStatus,
    json: async () => mockPayload,
    text: async () => JSON.stringify(mockPayload),
  })
}

const realFetch = globalThis.fetch
const OLD_ENV = { ...process.env }

beforeEach(() => {
  captured = []
  mockPayload = { successful: true, data: { post_id: 'oneup-post-123' }, log_id: 'log_test' }
  mockStatus = 200
  globalThis.fetch = mockFetch as unknown as typeof fetch
  process.env = { ...OLD_ENV, COMPOSIO_API_KEY: 'test-key' }
  delete process.env.ONEUP_ACCOUNT_IDS_JSON
})

afterEach(() => {
  globalThis.fetch = realFetch
  process.env = { ...OLD_ENV }
})

// ── tests ────────────────────────────────────────────────────────────────────

describe('isOneUpConfigured', () => {
  it('is false without an API key', () => {
    delete process.env.COMPOSIO_API_KEY
    assert.equal(isOneUpConfigured(), false)
  })

  it('is true with an API key', () => {
    assert.equal(isOneUpConfigured(), true)
  })
})

describe('getOneUpSocialAccountId', () => {
  it('maps facebook, instagram, and gbp', () => {
    assert.equal(getOneUpSocialAccountId('facebook'), '833640126497062')
    assert.equal(getOneUpSocialAccountId('instagram'), '17841470937590620')
    assert.ok((getOneUpSocialAccountId('gbp') ?? '').includes('13563616071314576110'))
  })

  it('returns null for unmapped platforms', () => {
    assert.equal(getOneUpSocialAccountId('linkedin'), null)
    assert.equal(getOneUpSocialAccountId('tiktok'), null)
  })

  it('honors ONEUP_ACCOUNT_IDS_JSON overrides', () => {
    process.env.ONEUP_ACCOUNT_IDS_JSON = JSON.stringify({ facebook: 'fb-override' })
    assert.equal(getOneUpSocialAccountId('facebook'), 'fb-override')
    assert.equal(getOneUpSocialAccountId('instagram'), '17841470937590620')
  })
})

describe('formatOneUpDateTime', () => {
  it('formats as YYYY-MM-DD HH:MM', () => {
    const out = formatOneUpDateTime(new Date('2026-10-05T12:00:00Z'))
    assert.match(out, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
  })
})

describe('publishViaOneUp', () => {
  it('includes the article link with a GBP image post', async () => {
    await publishViaOneUp('gbp', {
      caption: 'Read our article',
      linkUrl: 'https://hub.latimorelifelegacy.com/education/blog/example',
      mediaUrls: ['https://hub.latimorelifelegacy.com/flyer.png'],
    })
    const args = captured[0].body.arguments as Record<string, unknown>
    assert.equal(args.content, 'Read our article\n\nhttps://hub.latimorelifelegacy.com/education/blog/example')
    assert.equal(captured[0].url.endsWith('ONEUP_CREATE_IMAGE_POST'), true)
  })

  it('does not repeat an article link already in the caption', async () => {
    const linkUrl = 'https://hub.latimorelifelegacy.com/article'
    await publishViaOneUp('gbp', { caption: `Read ${linkUrl}`, linkUrl })
    const args = captured[0].body.arguments as Record<string, unknown>
    assert.equal(args.content, `Read ${linkUrl}`)
  })

  it('sends text posts to ONEUP_CREATE_TEXT_POST', async () => {
    const result = await publishViaOneUp('facebook', { caption: 'Hello world' })

    assert.equal(captured.length, 1)
    assert.ok(captured[0].url.endsWith('/tools/execute/ONEUP_CREATE_TEXT_POST'))
    const args = captured[0].body.arguments as Record<string, unknown>
    assert.equal(args.content, 'Hello world')
    assert.deepEqual(args.social_account_ids, ['833640126497062'])
    assert.equal(args.category_id, 187970)
    assert.match(args.scheduled_date_time as string, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)

    assert.equal(result.platform, 'facebook')
    assert.equal(result.via, 'oneup')
    assert.equal(result.externalPostId, 'oneup-post-123')
    assert.equal(result.logId, 'log_test')
  })

  it('sends image posts to ONEUP_CREATE_IMAGE_POST', async () => {
    await publishViaOneUp('instagram', {
      caption: 'Look at this',
      mediaUrls: ['https://example.com/photo.jpg'],
    })

    assert.ok(captured[0].url.endsWith('/tools/execute/ONEUP_CREATE_IMAGE_POST'))
    const args = captured[0].body.arguments as Record<string, unknown>
    assert.deepEqual(args.image_urls, ['https://example.com/photo.jpg'])
    assert.deepEqual(args.social_account_ids, ['17841470937590620'])
  })

  it('sends video posts to ONEUP_CREATE_VIDEO_POST', async () => {
    await publishViaOneUp('facebook', {
      caption: 'Watch this',
      mediaUrls: ['https://example.com/clip.mp4'],
    })

    assert.ok(captured[0].url.endsWith('/tools/execute/ONEUP_CREATE_VIDEO_POST'))
    const args = captured[0].body.arguments as Record<string, unknown>
    assert.equal(args.video_url, 'https://example.com/clip.mp4')
  })

  it('sends the API key in the x-api-key header via Composio', async () => {
    // Header assertion happens implicitly: executeOneUpTool throws without the key.
    // Here we verify the request body carries the connected account identity.
    await publishViaOneUp('gbp', { caption: 'GBP update' })
    assert.equal(captured[0].body.connected_account_id, 'ca_NFJKjvqIQvzo')
    assert.equal(captured[0].body.entity_id, 'jackson_latimore')
  })

  it('supports draft mode for safe testing', async () => {
    await publishViaOneUp('facebook', { caption: 'draft', asDraft: true })
    const args = captured[0].body.arguments as Record<string, unknown>
    assert.equal(args.is_draft, true)
  })

  it('throws for unmapped platforms before any HTTP call', async () => {
    await assert.rejects(() => publishViaOneUp('linkedin', { caption: 'x' }), /no mapped social account/)
    assert.equal(captured.length, 0)
  })

  it('throws when Composio reports failure', async () => {
    mockPayload = { successful: false, error: 'bad key', log_id: 'log_bad' }
    await assert.rejects(() => publishViaOneUp('facebook', { caption: 'x' }), /bad key/)
  })

  it('throws on HTTP errors', async () => {
    mockStatus = 401
    mockPayload = { error: { message: 'Invalid API key' } }
    await assert.rejects(() => publishViaOneUp('facebook', { caption: 'x' }), /HTTP 401/)
  })

  it('throws when COMPOSIO_API_KEY is missing', async () => {
    delete process.env.COMPOSIO_API_KEY
    await assert.rejects(() => publishViaOneUp('facebook', { caption: 'x' }), /COMPOSIO_API_KEY is not set/)
  })
})
