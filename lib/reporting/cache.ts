const cache = new Map<string, { expires: number; data: any }>()

export async function cached<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>
): Promise<T> {
  const now = Date.now()
  const entry = cache.get(key)

  if (entry && entry.expires > now) {
    return entry.data
  }

  const data = await fn()
  cache.set(key, { data, expires: now + ttlMs })
  return data
}
