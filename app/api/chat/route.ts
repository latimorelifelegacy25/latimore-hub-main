import { NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(1200),
})

const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1).max(12),
})

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

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { reply: 'Chat is not configured yet. Please call 717-615-2613 or email jackson1989@latimorelegacy.com.' },
      { status: 503 },
    )
  }

  try {
    const json = await req.json()
    const parsed = ChatRequestSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { reply: 'Please send a shorter message and try again.' },
        { status: 400 },
      )
    }

    const input = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...parsed.data.messages.map(message => ({
        role: message.role,
        content: message.content,
      })),
    ]

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_CHAT_MODEL ?? 'gpt-5.5',
        input,
        max_output_tokens: 500,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API returned ${response.status}`)
    }

    const data = await response.json() as { output_text?: string }
    const reply = data.output_text?.trim()

    return NextResponse.json({
      reply: reply || 'I can help with general insurance questions. For personalized guidance, please contact Jackson at 717-615-2613.',
    })
  } catch (error) {
    console.error('[chat] request failed', error)
    return NextResponse.json(
      { reply: 'Sorry, chat is having trouble right now. Please call 717-615-2613 or email jackson1989@latimorelegacy.com.' },
      { status: 500 },
    )
  }
}
