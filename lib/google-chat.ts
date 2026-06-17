import { requiredEnv } from '@/lib/required-env'

export async function sendGoogleChatMessage(text: string) {
  const webhookUrl = requiredEnv('GOOGLE_CHAT_WEBHOOK_URL')

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  })

  if (!response.ok) {
    throw new Error(`Google Chat notification failed: ${response.status}`)
  }
}
