// Prompt library for admin AI content tools.
// Each builder returns a `{ system, user, schema, schemaName }` payload ready
// for `createOpenAIJsonCompletion`. All system prompts are passed through
// `withAdminAiGuardrails` so every completion carries the founder-story and
// insurance-compliance guardrails defined in lib/ai/shared.ts.

import { withAdminAiGuardrails } from '@/lib/ai/shared'

export function objectionHandlerPrompt(params: {
  objection: string
  audience: string
  context?: string
}) {
  const system = withAdminAiGuardrails(
    `You write professional, empathetic objection-handling scripts for Latimore Life & Legacy advisors. Each response acknowledges the prospect's concern, reframes it without pressure, offers a credible point, and ends with a low-pressure next step.`,
  )

  const user = JSON.stringify({
    task: 'Generate an objection handler',
    objection: params.objection,
    audience: params.audience,
    context: params.context ?? 'Standard advisor conversation',
  })

  const schema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      acknowledgment: { type: 'string' },
      reframe: { type: 'string' },
      evidence: { type: 'string' },
      softClose: { type: 'string' },
      fullScript: { type: 'string' },
      doNotSay: { type: 'array', items: { type: 'string' } },
    },
    required: ['acknowledgment', 'reframe', 'evidence', 'softClose', 'fullScript', 'doNotSay'],
  }

  return { system, user, schema, schemaName: 'objection_handler' }
}

export function campaignBriefPrompt(params: {
  goal: string
  audience: string
  duration: string
  budget?: string
}) {
  const system = withAdminAiGuardrails(
    `You write complete multi-channel campaign briefs for Latimore Life & Legacy LLC, an insurance and financial services agency. Tie messaging to community, family, and legacy. Never use fear-based language or guarantee returns.`,
  )

  const user = JSON.stringify({
    task: 'Generate a campaign brief',
    goal: params.goal,
    audience: params.audience,
    duration: params.duration,
    budget: params.budget ?? 'Not specified',
  })

  const schema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      campaignName: { type: 'string' },
      objective: { type: 'string' },
      keyMessage: { type: 'string' },
      contentPillars: { type: 'array', items: { type: 'string' } },
      channelStrategy: {
        type: 'object',
        additionalProperties: false,
        properties: {
          organic: { type: 'array', items: { type: 'string' } },
          paid: { type: 'array', items: { type: 'string' } },
          email: { type: 'array', items: { type: 'string' } },
          sms: { type: 'array', items: { type: 'string' } },
        },
        required: ['organic', 'paid', 'email', 'sms'],
      },
      kpis: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            metric: { type: 'string' },
            target: { type: 'string' },
          },
          required: ['metric', 'target'],
        },
      },
      risks: { type: 'array', items: { type: 'string' } },
    },
    required: ['campaignName', 'objective', 'keyMessage', 'contentPillars', 'channelStrategy', 'kpis', 'risks'],
  }

  return { system, user, schema, schemaName: 'campaign_brief' }
}

export function captionVariantsPrompt(params: {
  originalCaption: string
  audience: string
  variantCount?: number
}) {
  const system = withAdminAiGuardrails(
    `You write A/B test variants of social media captions for Latimore Life & Legacy. Each variant must keep the core message, test a different hook style, and stay compliant with insurance marketing guardrails.`,
  )

  const user = JSON.stringify({
    task: 'Generate caption A/B variants',
    originalCaption: params.originalCaption,
    audience: params.audience,
    variantCount: params.variantCount ?? 3,
  })

  const schema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      variants: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            hookStyle: { type: 'string', enum: ['question', 'statement', 'story', 'stat'] },
            caption: { type: 'string' },
            hypothesis: { type: 'string' },
          },
          required: ['hookStyle', 'caption', 'hypothesis'],
        },
      },
    },
    required: ['variants'],
  }

  return { system, user, schema, schemaName: 'caption_variants' }
}
