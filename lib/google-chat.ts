import { requiredEnv } from '@/lib/required-env'

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function sendGoogleChatMessage(text: string) {
  const webhookUrl = requiredEnv('GOOGLE_CHAT_WEBHOOK_URL')
  let lastError: unknown = null

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      })

      if (response.ok) return

      const body = await response.text().catch(() => '')
      lastError = new Error(`Google Chat notification failed: ${response.status}${body ? ` - ${body.slice(0, 250)}` : ''}`)
    } catch (error) {
      lastError = error
    }

    if (attempt < 3) {
      await delay(attempt * 500)
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Google Chat notification failed')
}
