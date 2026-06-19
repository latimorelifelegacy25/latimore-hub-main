import { createOpenAIJsonCompletion } from '@/lib/ai/client'
import { checkCompliance, type ComplianceResult } from '@/lib/ai/compliance'
import { withAdminAiGuardrails } from '@/lib/ai/shared'

export type RepurposeSource = {
  title: string
  slug: string
  content: string
  coreMessage?: string
  ctaLabel?: string
  ctaLink?: string
  tags?: string[]
}

export type SocialChannel = 'instagram' | 'twitter' | 'linkedin'

export type RepurposedDraft = {
  channel: SocialChannel
  caption: string
  hashtags: string[]
  threadPosts?: string[]
  compliance: ComplianceResult
  model: string
}

const BRAND_VOICE = `You are writing social captions for Latimore Life & Legacy LLC, an independent insurance agency in Schuylkill County, Pennsylvania.
Owner: Jackson M. Latimore Sr., MBA — Coal Region native, cardiac arrest survivor, community coach.
Tagline: "Protecting Today. Securing Tomorrow." Mission hashtag: #TheBeatGoesOn. License: PA DOI #1268820.
Brand voice: bold, warm, educational, dignity-first — never fear-based, never a definitive guarantee about insurance outcomes. Use "may", "can", "could" for outcome statements.`

const PLATFORM_INSTRUCTIONS: Record<SocialChannel, string> = {
  instagram: 'Write an Instagram caption (80–150 words, family-centered, low-pressure, ends with the CTA) and 3–6 hashtags mixing local, service, and brand tags.',
  twitter: 'Write a 5-post X/Twitter thread (each post under 280 characters, sharp and conversational, last post includes the CTA link) and 1–2 hashtags total.',
  linkedin: 'Write a LinkedIn post (150–300 words, professional and consultative, soft CTA close) and 2–3 hashtags.',
}

const RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    caption: { type: 'string' },
    hashtags: { type: 'array', items: { type: 'string' } },
    threadPosts: { type: 'array', items: { type: 'string' } },
  },
  required: ['caption', 'hashtags', 'threadPosts'],
}

async function generateForChannel(channel: SocialChannel, source: RepurposeSource): Promise<RepurposedDraft> {
  const completion = await createOpenAIJsonCompletion<{ caption: string; hashtags: string[]; threadPosts: string[] | null }>({
    system: withAdminAiGuardrails(BRAND_VOICE),
    user: JSON.stringify({
      task: PLATFORM_INSTRUCTIONS[channel],
      source: {
        title: source.title,
        coreMessage: source.coreMessage ?? null,
        contentExcerpt: source.content.slice(0, 2000),
        tags: source.tags ?? [],
        ctaLabel: source.ctaLabel ?? 'Book your free Legacy Checkup',
        ctaLink: source.ctaLink ?? 'https://latimorelifelegacy.com/contact',
      },
    }),
    schemaName: `content_repurpose_${channel}`,
    schema: RESPONSE_SCHEMA,
    temperature: 0.4,
  })

  const threadPosts = channel === 'twitter' && completion.output.threadPosts?.length ? completion.output.threadPosts : undefined
  const complianceInput = [completion.output.caption, ...(threadPosts ?? [])].join('\n')

  return {
    channel,
    caption: completion.output.caption,
    hashtags: completion.output.hashtags ?? [],
    threadPosts,
    compliance: checkCompliance(complianceInput),
    model: completion.model,
  }
}

export async function repurposeContent(source: RepurposeSource): Promise<Record<SocialChannel, RepurposedDraft>> {
  const [instagram, twitter, linkedin] = await Promise.all([
    generateForChannel('instagram', source),
    generateForChannel('twitter', source),
    generateForChannel('linkedin', source),
  ])
  return { instagram, twitter, linkedin }
}
