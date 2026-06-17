import pino from 'pino'

const base = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
})

// Field names that hold customer/contact PII somewhere in this codebase's
// log payloads (notification bodies, automation rule actions, system event
// inputs, etc. all pass through loosely-typed objects that can carry these).
// Matched by exact key name, case-insensitive, at any depth — so structured
// log calls don't need to know in advance whether a nested object happens
// to carry one of these fields.
const PII_KEYS = new Set([
  'email',
  'phone',
  'phonenumber',
  'fullname',
  'firstname',
  'lastname',
  'address',
  'notes',
  'notessummary',
  'ssn',
  'dob',
  'dateofbirth',
])

const MAX_DEPTH = 6

function redactPII(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH || value === null || typeof value !== 'object') return value
  if (value instanceof Error) return value
  if (Array.isArray(value)) return value.map(item => redactPII(item, depth + 1))

  const result: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (PII_KEYS.has(key.toLowerCase())) {
      result[key] = '[REDACTED]'
    } else if (val !== null && typeof val === 'object') {
      result[key] = redactPII(val, depth + 1)
    } else {
      result[key] = val
    }
  }
  return result
}

type LogMethod = (...args: unknown[]) => void

function withRedaction(method: LogMethod): LogMethod {
  return (...args: unknown[]) => {
    if (args.length > 0 && args[0] !== null && typeof args[0] === 'object') {
      method(redactPII(args[0]), ...args.slice(1))
    } else {
      method(...args)
    }
  }
}

export const logger = {
  ...base,
  info: withRedaction(base.info.bind(base)),
  warn: withRedaction(base.warn.bind(base)),
  error: withRedaction(base.error.bind(base)),
  debug: withRedaction(base.debug.bind(base)),
  fatal: withRedaction(base.fatal.bind(base)),
  trace: withRedaction(base.trace.bind(base)),
} as pino.Logger
