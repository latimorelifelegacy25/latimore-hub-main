import test from 'node:test'
import assert from 'node:assert/strict'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { evaluatePublishGate } from './approval-gate'
import { holdBlockedAsset } from './approval-gate-assets'

test('a held asset returns to draft and repeated holds create one generic notification', async () => {
  const originalUpdate = prisma.contentAsset.update
  const originalCreate = prisma.notification.create
  const originalFind = prisma.notification.findUnique
  let row: any = null
  let updated: any = null
  let created = 0
  try {
    prisma.contentAsset.update = (async ({ data }: any) => { updated = data; return {} }) as typeof originalUpdate
    prisma.notification.create = (async ({ data }: any) => {
      if (row) throw new Prisma.PrismaClientKnownRequestError('duplicate', { code: 'P2002', clientVersion: '5.22.0' })
      created++
      row = { ...data, id: 'test-notification', createdAt: new Date(), readAt: null, contactId: null, taskId: null, appointmentId: null }
      return row
    }) as typeof originalCreate
    prisma.notification.findUnique = (async () => row) as typeof originalFind
    const gate = evaluatePublishGate({ text: 'Guaranteed income', status: 'scheduled', mode: 'enforce' })
    assert.equal(gate.allowed, false)
    const asset = { id: 'test-held-asset', metadata: { preserved: true } } as unknown as Parameters<typeof holdBlockedAsset>[0]
    await holdBlockedAsset(asset, gate)
    await holdBlockedAsset(asset, gate)
    assert.equal(updated.status, 'draft')
    assert.equal(updated.metadata.preserved, true)
    assert.ok(updated.metadata.publishBlocked.blockers.length)
    assert.equal(created, 1)
    assert.equal(row.dedupeKey, 'publish_blocked:test-held-asset')
    assert.equal(row.priority, 'high')
    assert.ok(!row.message.includes('Guaranteed income'))
    assert.ok(row.message.includes('test-held-asset'))
  } finally {
    prisma.contentAsset.update = originalUpdate
    prisma.notification.create = originalCreate
    prisma.notification.findUnique = originalFind
  }
})
