import test from 'node:test'
import assert from 'node:assert/strict'
import { evaluatePublishGate } from './approval-gate'

test('clean approved content is allowed with campaign/source warnings', () => {
  const r = evaluatePublishGate({ text: 'Learn about coverage options.', status: 'approved', hasSource: false })
  assert.equal(r.allowed, true)
  assert.equal(r.warnings.length, 2)
})

test('critical violation blocks', () => {
  const r = evaluatePublishGate({ text: 'We guarantee you will be approved.', status: 'approved' })
  assert.equal(r.allowed, false)
  assert.ok(r.blockers.some((b) => b.includes('Compliance review failed')))
})

test('non-publishable status blocks; omitted status does not', () => {
  assert.equal(evaluatePublishGate({ text: 'Hello', status: 'draft' }).allowed, false)
  assert.equal(evaluatePublishGate({ text: 'Hello' }).allowed, true)
})

test('fails closed when compliance check throws', () => {
  const r = evaluatePublishGate({ text: 'Hello', checkCompliance: () => { throw new Error('boom') } })
  assert.equal(r.allowed, false)
  assert.ok(!r.blockers.join(' ').includes('boom'))
})

test('HTML is stripped before review', () => {
  const r = evaluatePublishGate({ text: '<p>You will <b>receive</b> a payout</p>', status: 'approved' })
  assert.equal(r.allowed, false)
})

const bad = 'We guarantee you will be approved.'

test('enforce mode (default) blocks critical', () => {
  const r = evaluatePublishGate({ text: bad, status: 'approved', mode: 'enforce' })
  assert.equal(r.allowed, false)
  assert.equal(r.wouldHaveBlocked, false)
  assert.ok(r.blockedRules.length > 0)
})

test('warn mode allows critical, copies blockers to warnings, flags wouldHaveBlocked', () => {
  const r = evaluatePublishGate({ text: bad, status: 'approved', mode: 'warn' })
  assert.equal(r.allowed, true)
  assert.equal(r.blockers.length, 0)
  assert.equal(r.wouldHaveBlocked, true)
  assert.ok(r.warnings.some((w) => w.includes('would block')))
})

test('warn mode still fails closed when checker errors', () => {
  const r = evaluatePublishGate({ text: 'x', mode: 'warn', checkCompliance: () => { throw new Error('boom') } })
  assert.equal(r.allowed, false)
  assert.equal(r.blockers.length, 1)
})

test('PUBLISH_GATE_MODE env is read; unset means enforce', () => {
  const prev = process.env.PUBLISH_GATE_MODE
  try {
    delete process.env.PUBLISH_GATE_MODE
    assert.equal(evaluatePublishGate({ text: bad, status: 'approved' }).allowed, false)
    process.env.PUBLISH_GATE_MODE = 'warn'
    assert.equal(evaluatePublishGate({ text: bad, status: 'approved' }).allowed, true)
  } finally {
    if (prev === undefined) delete process.env.PUBLISH_GATE_MODE
    else process.env.PUBLISH_GATE_MODE = prev
  }
})
