import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  createRateLimitResponse,
  getClientFingerprint,
  isRateLimited,
} from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_REQUEST_BYTES = 10_000
const OPENAI_TIMEOUT_MS = 15_000

const ALLOWED_CHAT_ORIGINS = new Set([
  'https://www.latimorelifelegacy.com',
  'https://latimorelifelegacy.com',
  'https://lifeandlegacy.vercel.app',
  ...(process.env.NODE_ENV === 'development'
    ? ['http://localhost:3000', 'http://localhost:3001']
    : []),
])

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(1200),
})

const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1).max(12),
})

const CONTACT_REPLY = 'For personalized guidance, contact Jackson at 717-615-2613 or jackson1989@latimorelegacy.com. He can help you review options and next steps.'

function createLocalReply(message: string) {
  const normalized = message.toLowerCase()

  if (normalized.includes('service') || normalized.includes('offer') || normalized.includes('what do you do')) {
    return [
      'Latimore Life & Legacy helps with life insurance, mortgage protection, final expense coverage,',
      'indexed universal life, fixed indexed annuities, retirement income education, juvenile life policies,',
      'business protection, college funding education, debt management education, and legacy planning basics through referral partners.',
      CONTACT_REPLY,
    ].join(' ')
  }

  if (normalized.includes('mortgage')) {
    return [
      'Mortgage protection is life insurance designed to help your family keep the home if something happens to you.',
      'It can provide money for the mortgage, bills, or other needs instead of leaving loved ones with the payment alone.',
      CONTACT_REPLY,
    ].join(' ')
  }

  if (
    normalized.includes('quote') ||
    normalized.includes('price') ||
    normalized.includes('cost') ||
    normalized.includes('rate')
  ) {
    return [
      'To get a quote, Jackson will usually need a few basics: your age range, county, coverage goal,',
      'approximate amount of protection, and preferred contact method.',
      'You can call 717-615-2613 or email jackson1989@latimorelegacy.com to start.',
    ].join(' ')
  }

  if (normalized.includes('final expense') || normalized.includes('burial') || normalized.includes('funeral')) {
    return [
      'Final expense coverage is life insurance intended to help loved ones handle funeral costs, burial expenses,',
      'medical bills, or other end-of-life needs. The right amount depends on your goals and budget.',
      CONTACT_REPLY,
    ].join(' ')
  }

  if (normalized.includes('annuity') || normalized.includes('retirement')) {
    return [
      'Latimore Life & Legacy can provide education around fixed indexed annuities and retirement income planning.',
      'Annuities are not right for everyone, so it is best to review your timeline, risk comfort,',
      'and income goals with a licensed professional.',
      CONTACT_REPLY,
    ].join(' ')
  }

  if (normalized.includes('contact') || normalized.includes('phone') || normalized.includes('email') || normalized.includes('jackson')) {
    return 'You can reach Jackson M. Latimore Sr. by phone at 717-615-2613 or by email at jackson1989@latimorelegacy.com.'
  }

  return [
    'I can help with general questions about life insurance, mortgage protection, final expense,',
    'annuities, retirement income education, and how to contact Jackson.',
    CONTACT_REPLY,
  ].join(' ')
}

const SYSTEM_PROMPT = `You are the public website assistant for Latimore Life & Legacy LLC.

Business context:
- Independent insurance guidance for families, pre-retirees, and local employers across Schuylkill, Luzerne, and Northumberland Counties, Pennsylvania.
- Services include term life, mortgage protection, final expense, indexed universal life, fixed indexed annuities, retirement income, juvenile life policies, business protection, college funding education, debt management education, and estate or legacy basics through referral partners.
- Founder: Jackson M. Latimore Sr.
- Website: https://www.latimorelifelegacy.com
- Phone: 717-615-2613
- Email: jackson1989@latimorelegacy.com

Rules:
- Keep answers concise, professional, plain-language, and education-first.
- Do not provide legal, tax, investment, or medical advice.
- Do not guarantee pricing, approval, benefits, returns, or outcomes.
- For personal coverage decisions, recommend speaking with a licensed agent.
- Ask for the user's county, age range, coverage goal, and contact preference only when useful.
- Never claim to bind coverage or submit an application from chat.
- Encourage booking or contacting Jackson when the user shows purchase intent.`

function jsonReply(reply: string, init?: ResponseInit) {
  return NextResponse.json(
    { reply },
    {
      ...init,
      headers: {
        'Cache-Control': 'no-store',
        ...(init?.headers ?? {}),
      },
    },
  )
}

function getContentLength(req: NextRequest) {
  const value = Number(req.headers.get('content-length'))
  return Number.isFinite(value) && value > 0 ? value : null
}

function getOriginFromReferer(referer: string | null) {
  if (!referer) return null
  try {
    return new URL(referer).origin
  } catch {
    return null
  }
}

function isAllowedChatOrigin(req: NextRequest) {
  if (req.headers.get('sec-fetch-site') === 'cross-site') {
    return false
  }

  const origin = req.headers.get('origin') ?? getOriginFromReferer(req.headers.get('referer'))
  if (!origin) return true
  return ALLOWED_CHAT_ORIGINS.has(origin)
}

export async function POST(req: NextRequest) {
  if (!isAllowedChatOrigin(req)) {
    return jsonReply('This chat can only be used from the Latimore Life & Legacy website.', {
      status: 403,
    })
  }

  const contentLength = getContentLength(req)
  if (contentLength && contentLength > MAX_REQUEST_BYTES) {
    return jsonReply('Please send a shorter message and try again.', { status: 413 })
  }

  const clientKey = getClientFingerprint(req)
  if (await isRateLimited(req, 'chat', clientKey)) {
    return createRateLimitResponse('chat', {
      reply: 'You’re sending messages too quickly. Please wait a minute and try again.',
    })
  }

  try {
    const json = await req.json()
    const parsed = ChatRequestSchema.safeParse(json)

    if (!parsed.success) {
      return jsonReply('Please send a shorter message and try again.', { status: 400 })
    }

    const latestUserMessage = [...parsed.data.messages].reverse().find(message => message.role === 'user')

    if (!latestUserMessage) {
      return jsonReply('Please send a message to start the chat.', { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return jsonReply(createLocalReply(latestUserMessage.content))
    }

    const input = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...parsed.data.messages.map(message => ({
        role: message.role,
        content: message.content,
      })),
    ]

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS)

    let response: Response
    try {
      response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.OPENAI_CHAT_MODEL ?? 'gpt-5.5',
          input,
          max_output_tokens: 350,
        }),
        cache: 'no-store',
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeout)
    }

    if (!response.ok) {
      logger.warn({ status: response.status }, '[chat] OpenAI API returned non-OK status')
      throw new Error(`OpenAI API returned ${response.status}`)
    }

    const data = await response.json() as { output_text?: string }
    const reply = data.output_text?.trim()

    return jsonReply(
      reply || 'I can help with general insurance questions. For personalized guidance, please contact Jackson at 717-615-2613.',
    )
  } catch (error) {
    logger.error({ error }, '[chat] request failed')
    return jsonReply(
      'Sorry, chat is having trouble right now. Please call 717-615-2613 or email jackson1989@latimorelegacy.com.',
      { status: 500 },
    )
  }
}
