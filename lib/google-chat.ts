function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function sendGoogleChatMessage(text: string, timeoutMs = 8_000) {
  const webhookUrl = process.env.GOOGLE_CHAT_WEBHOOK_URL
  if (!webhookUrl) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Google Chat notification skipped: GOOGLE_CHAT_WEBHOOK_URL is not configured')
    }
    return
  }
  let lastError: unknown = null

  for (let attempt = 1; attempt <= 3; attempt++) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      })

      if (response.ok) return

      const body = await response.text().catch(() => '')
      lastError = new Error(`Google Chat notification failed: ${response.status}${body ? ` - ${body.slice(0, 250)}` : ''}`)
    } catch (error) {
      lastError = error
    } finally {
      clearTimeout(timeout)
    }

    if (attempt < 3) {
      await delay(attempt * 500)
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Google Chat notification failed')
}
