import { createOpenAIJsonCompletion } from '@/lib/ai/client'
import { withAdminAiGuardrails } from '@/lib/ai/shared'
import type { ContentBrief, EditorIssue, EditorReview, RepurposedVariant } from './types'

// Reasoning-heavy agents share one model; the mechanical repurposing step can use a cheaper one.
// Both fall back to the provider default when unset. Names must match the active AI_PROVIDER.
const reasoningModel = () => process.env.PIPELINE_REASONING_MODEL || undefined
const repurposeModel = () => process.env.PIPELINE_REPURPOSE_MODEL || undefined

const BRAND = `Brand: Latimore Life & Legacy LLC, independent insurance agency serving Schuylkill, Luzerne, and Northumberland Counties, PA. Founder: Jackson M. Latimore Sr. Voice: bold, warm, educational, dignity-first. Never fear-based. Use "may", "can", "could" for outcomes, never a definitive guarantee.`

const NO_INVENTION = `Never invent a statistic, quote, source, rate, law, or carrier feature. Use only facts present in the material you are given.`

const briefSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    needsMoreInput: { type: 'boolean' },
    missingInputs: { type: 'array', items: { type: 'string' } },
    angle: { type: 'string' },
    audience: { type: 'string' },
    keyMessage: { type: 'string' },
    mustIncludeFacts: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: { fact: { type: 'string' }, source: { type: 'string' } },
        required: ['fact', 'source'],
      },
    },
    callToAction: { type: 'string' },
    channelNotes: {
      type: 'object',
      additionalProperties: false,
      properties: { blog: { type: 'string' }, social: { type: 'string' }, email: { type: 'string' } },
      required: ['blog', 'social', 'email'],
    },
    targetLength: { type: 'string' },
  },
  required: [
    'needsMoreInput',
    'missingInputs',
    'angle',
    'audience',
    'keyMessage',
    'mustIncludeFacts',
    'callToAction',
    'channelNotes',
    'targetLength',
  ],
}

export async function runStrategist(input: { topic: string; sourceMaterial: string; channelGoals: string }) {
  return createOpenAIJsonCompletion<ContentBrief>({
    model: reasoningModel(),
    system: withAdminAiGuardrails(`You are the Content Strategist for the Latimore content pipeline. ${BRAND}
Turn the topic and source material into ONE shared content brief covering: core angle and key message, target audience, 3-5 must-include facts, the call to action, and short notes on how the blog, social, and email versions should each be weighted.
${NO_INVENTION}
Every must-include fact must be traceable to the source material; put a short pointer to where it came from in "source".
If the material is too thin to write a confident brief, set needsMoreInput=true, list exactly what you need in missingInputs, and leave the other fields as short placeholders. Do not guess to fill the gap.
When needsMoreInput is false, missingInputs must be empty. Keep the brief to one page.`),
    user: JSON.stringify({ topic: input.topic, sourceMaterial: input.sourceMaterial, channelGoals: input.channelGoals }),
    schemaName: 'content_pipeline_brief',
    schema: briefSchema,
    temperature: 0.3,
  })
}

const draftSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    draft: { type: 'string' },
    flags: { type: 'array', items: { type: 'string' } },
  },
  required: ['draft', 'flags'],
}

export async function runWriter(input: {
  brief: ContentBrief
  voiceNotes?: string
  previousDraft?: string
  editorIssues?: EditorIssue[]
}) {
  const revising = Boolean(input.previousDraft && input.editorIssues?.length)
  return createOpenAIJsonCompletion<{ draft: string; flags: string[] }>({
    model: reasoningModel(),
    system: withAdminAiGuardrails(`You are the Drafting Writer for the Latimore content pipeline. ${BRAND}
Write the full ${revising ? 'revised ' : 'first '}draft of the primary piece (blog post unless the brief says otherwise) strictly from the brief: match its angle, audience, key message, and facts, and hit its target length. Plain text with simple section headings, no emojis.
${NO_INVENTION}
Do not add any fact not in the brief. Do not copy language from any other published source.
${revising ? 'You are revising a draft. Fix every issue the Editor listed, change nothing else unnecessarily, and do not reintroduce a flagged claim.' : ''}
If anything in the brief is ambiguous or a claim cannot be verified from it, make the safest choice and describe it in "flags" (one line each) instead of asserting it silently.`),
    user: JSON.stringify({
      brief: input.brief,
      voiceNotes: input.voiceNotes ?? null,
      previousDraft: input.previousDraft ?? null,
      editorIssues: input.editorIssues ?? null,
    }),
    schemaName: 'content_pipeline_draft',
    schema: draftSchema,
    temperature: 0.6,
  })
}

const reviewSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    status: { type: 'string', enum: ['APPROVED', 'CHANGES_REQUESTED'] },
    issues: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          severity: { type: 'string', enum: ['blocker', 'major', 'minor'] },
          location: { type: 'string' },
          problem: { type: 'string' },
          suggestedFix: { type: 'string' },
        },
        required: ['severity', 'location', 'problem', 'suggestedFix'],
      },
    },
    unsupportedClaims: { type: 'array', items: { type: 'string' } },
  },
  required: ['status', 'issues', 'unsupportedClaims'],
}

export async function runEditor(input: { brief: ContentBrief; draft: string; writerFlags: string[] }) {
  return createOpenAIJsonCompletion<EditorReview>({
    model: reasoningModel(),
    system: withAdminAiGuardrails(`You are the Editor & Quality Reviewer for the Latimore content pipeline. ${BRAND}
Check the draft against the brief for: (1) factual accuracy — every claim must trace back to the brief; list any that do not in unsupportedClaims, (2) voice and tone, (3) grammar, (4) compliance and disclosure risk for Pennsylvania insurance marketing (absolute claims, tax-free or guarantee language, fear-based framing, individualized advice, missing "may/can/could" qualifiers).
DO NOT rewrite the piece. Respond APPROVED with no blocker or major issues and no unsupportedClaims, or CHANGES_REQUESTED with specific issues, each with a one-line suggested fix. Be direct about anything that would embarrass the brand if published as-is.
Never approve without checking every claim. Also review the Writer's flags and decide whether each is acceptable.`),
    user: JSON.stringify({ brief: input.brief, draft: input.draft, writerFlags: input.writerFlags }),
    schemaName: 'content_pipeline_review',
    schema: reviewSchema,
    temperature: 0.1,
  })
}

const variantsSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    variants: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          channel: { type: 'string', enum: ['linkedin', 'facebook', 'instagram', 'email'] },
          body: { type: 'string' },
          hashtags: { type: 'array', items: { type: 'string' } },
          subject: { type: 'string' },
          preheader: { type: 'string' },
        },
        required: ['channel', 'body', 'hashtags', 'subject', 'preheader'],
      },
    },
  },
  required: ['variants'],
}

const CHANNEL_SPECS = `- linkedin: 150-300 words, professional and consultative, soft CTA close, 2-3 hashtags.
- facebook: 80-150 words, warm and community-minded, ends with the CTA, 0-2 hashtags.
- instagram: 80-150 words, family-centered and low-pressure, ends with the CTA, 3-6 hashtags mixing local and brand tags.
- email: short newsletter version (150-250 words) with a clear subject line (under 60 characters) and a preheader (under 100 characters); hashtags empty.
For non-email channels set subject and preheader to empty strings.`

export async function runRepurposer(input: { approvedDraft: string; brief: ContentBrief }) {
  return createOpenAIJsonCompletion<{ variants: RepurposedVariant[] }>({
    model: repurposeModel(),
    system: withAdminAiGuardrails(`You are the Repurposing agent for the Latimore content pipeline. ${BRAND}
You receive an APPROVED draft only. Adapt it into exactly one variant per channel:
${CHANNEL_SPECS}
Keep the same facts and core message as the approved draft. Do not add any new claim, statistic, or quote. Reuse the brief's call to action.`),
    user: JSON.stringify({ approvedDraft: input.approvedDraft, callToAction: input.brief.callToAction, keyMessage: input.brief.keyMessage }),
    schemaName: 'content_pipeline_variants',
    schema: variantsSchema,
    temperature: 0.4,
  })
}
