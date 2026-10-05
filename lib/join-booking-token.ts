import { createHmac, timingSafeEqual } from 'node:crypto'

function sign(value: string) {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('Recruiting booking authorization is unavailable')
  return createHmac('sha256', secret).update(`join-booking:${value}`).digest('base64url')
}

export function createJoinBookingToken(applicationId: string) {
  const value = `${applicationId}.${Date.now() + 24 * 60 * 60 * 1000}`
  return `${value}.${sign(value)}`
}

export function verifyJoinBookingToken(applicationId: string, token: string) {
  const [id, expires, signature, extra] = token.split('.')
  if (extra || id !== applicationId || !signature || !Number.isFinite(Number(expires)) || Number(expires) <= Date.now()) return false
  const expected = Buffer.from(sign(`${id}.${expires}`))
  const actual = Buffer.from(signature)
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
