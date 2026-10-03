import { createHash, timingSafeEqual } from 'node:crypto'

// Constant-time string comparison. Both inputs are hashed first so differing
// lengths never throw and length is not leaked.
export function safeEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  const ha = createHash('sha256').update(a).digest()
  const hb = createHash('sha256').update(b).digest()
  return timingSafeEqual(ha, hb)
}
