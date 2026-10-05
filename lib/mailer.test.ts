import test from 'node:test'
import assert from 'node:assert/strict'
import { sendMail } from './mailer'

test('email success requires a provider message id; rejected sends do not report success', async () => {
  const originalFetch = globalThis.fetch
  const originalKey = process.env.RESEND_API_KEY
  process.env.RESEND_API_KEY = 're_test_only'
  const args = { from: 'test@example.com', to: 'owner@example.com', subject: 'test', html: '<p>test</p>' }
  try {
    globalThis.fetch = async () => Response.json({ name: 'validation_error', message: 'Sender is not verified' }, { status: 422 })
    assert.deepEqual(await sendMail(args), { ok: false, error: 'Sender is not verified' })
    globalThis.fetch = async () => Response.json({})
    assert.equal((await sendMail(args)).ok, false)
    globalThis.fetch = async () => Response.json({ id: 'accepted-message' })
    assert.deepEqual(await sendMail(args), { ok: true, id: 'accepted-message' })
  } finally {
    globalThis.fetch = originalFetch
    if (originalKey === undefined) delete process.env.RESEND_API_KEY
    else process.env.RESEND_API_KEY = originalKey
  }
})
