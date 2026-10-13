import { test } from 'node:test'
import assert from 'node:assert/strict'
import { prisma } from '@/lib/prisma'
import { canonicalizeDestination, createGbpTrackingLink, createSocialTrackingLink } from '../social-link'

test('social links use the public host, canonical destinations, and per-platform attribution', async () => {
  const original = prisma.trackingLink.create
  const writes: any[] = []
  prisma.trackingLink.create = (async (args: any) => { writes.push(args.data); return args.data }) as any
  try {
    const url = await createGbpTrackingLink('/education/blog/example', { postId: 'post-123', createdBy: 'admin@example.com' })
    assert.match(url, /^https:\/\/www\.latimorelifelegacy\.com\/t\/gbp-[a-f0-9]{24}$/)
    assert.equal(writes[0].destination, '/blog/example')
    assert.equal(writes[0].utmSource, 'gbp')
    assert.equal(writes[0].utmMedium, 'social')
    assert.equal(writes[0].utmContent, 'post-123')

    const fb = await createSocialTrackingLink('facebook', 'https://latimorelifelegacy.com/education/blog/example?x=1', { campaign: 'Living-Benefits' })
    assert.match(fb, /\/t\/facebook-[a-f0-9]{24}$/)
    assert.equal(writes[1].destination, 'https://www.latimorelifelegacy.com/blog/example?x=1')
    assert.equal(writes[1].utmSource, 'facebook')
    assert.equal(writes[1].utmCampaign, 'living-benefits')

    await assert.rejects(createGbpTrackingLink('https://unapproved.example/article'), /not an allowed/)
    assert.equal(writes.length, 2)
  } finally {
    prisma.trackingLink.create = original
  }
})

test('canonicalizeDestination leaves other paths and hosts alone', () => {
  assert.equal(canonicalizeDestination('/blog/a'), '/blog/a')
  assert.equal(canonicalizeDestination('/education'), '/education')
  assert.equal(canonicalizeDestination('https://hub.latimorelifelegacy.com/x'), 'https://hub.latimorelifelegacy.com/x')
})
