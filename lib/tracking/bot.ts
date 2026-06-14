const BOT_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /preview/i,
  /facebookexternalhit/i,
  /linkedinbot/i,
  /slackbot/i,
  /discordbot/i,
  /whatsapp/i,
]

export type ClickClassification = {
  isBot: boolean
  botReason?: string
}

export function classifyClick(userAgent: string | null | undefined): ClickClassification {
  if (!userAgent) return { isBot: false }

  const matched = BOT_PATTERNS.find((pattern) => pattern.test(userAgent))
  return matched ? { isBot: true, botReason: matched.source } : { isBot: false }
}
