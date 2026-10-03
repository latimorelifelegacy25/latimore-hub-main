import { test } from 'node:test'
import assert from 'node:assert/strict'
import { encryptToken, decryptToken } from '../lib/crypto'

const env: Record<string, string | undefined> = process.env

test('tokens round-trip, use fresh IVs, and reject tampered ciphertext', () => {
  const original = process.env.TOKEN_ENCRYPTION_KEY
  try {
    process.env.TOKEN_ENCRYPTION_KEY = 'ab'.repeat(32)
    const first = encryptToken('sample-oauth-token')
    const second = encryptToken('sample-oauth-token')
    assert.ok(first.startsWith('enc:'))
    assert.notEqual(first, second)
    assert.equal(decryptToken(first), 'sample-oauth-token')
    const parts = first.split(':')
    parts[3] = (parts[3][0] === '0' ? '1' : '0') + parts[3].slice(1)
    assert.equal(decryptToken(parts.join(':')), null)
    assert.equal(decryptToken('legacy-token'), 'legacy-token')
  } finally {
    if (original === undefined) delete process.env.TOKEN_ENCRYPTION_KEY
    else process.env.TOKEN_ENCRYPTION_KEY = original
  }
})

test('production refuses to store plaintext tokens when encryption is unconfigured', () => {
  const key = process.env.TOKEN_ENCRYPTION_KEY
  const mode = env.NODE_ENV
  try {
    delete process.env.TOKEN_ENCRYPTION_KEY
    env.NODE_ENV = 'production'
    assert.throws(() => encryptToken('sample-token'), /TOKEN_ENCRYPTION_KEY is required/)
    env.NODE_ENV = 'test'
    assert.equal(encryptToken('local-token'), 'local-token')
  } finally {
    if (key === undefined) delete process.env.TOKEN_ENCRYPTION_KEY
    else process.env.TOKEN_ENCRYPTION_KEY = key
    if (mode === undefined) delete env.NODE_ENV
    else env.NODE_ENV = mode
  }
})
