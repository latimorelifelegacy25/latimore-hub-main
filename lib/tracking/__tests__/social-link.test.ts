import { test } from 'node:test'
import assert from 'node:assert/strict'
import { prisma } from '@/lib/prisma'
import { createGbpTrackingLink } from '../social-link'

test('GBP links store attribution and reject unapproved destinations before writing', async () => {
  const original = prisma.trackingLink.create
  const writes: any[] = []
  prisma.trackingLink.create = (async (args: any) => { writes.push(args.data); return args.data }) as any
  try {
    const url = await createGbpTrackingLink('/education/blog/example', {
      origin: 'https://hub.latimorelifelegacy.com', postId: 'post-123', createdBy: 'admin@example.com',
    })
    assert.match(url, /^https:\/\/hub\.latimorelifelegacy\.com\/t\/gbp-[a-f0-9]{24}$/)
    assert.equal(writes[0].destination, '/education/blog/example')
    assert.equal(writes[0].utmSource, 'gbp')
    assert.equal(writes[0].utmMedium, 'social')
    assert.equal(writes[0].utmContent, 'post-123')
    await assert.rejects(createGbpTrackingLink('https://unapproved.example/article'), /not an allowed/)
    assert.equal(writes.length, 1)
  } finally {
    prisma.trackingLink.create = original
  }
})
