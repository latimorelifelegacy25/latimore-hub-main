/**
 * LLM Client — OpenAI + Anthropic
 * Thin wrapper with token tracking and error handling
 */

import type { LLMMessage, LLMRequest, LLMResponse, WorkerEnv } from '../types';

// ── OPENAI ────────────────────────────────────────────────────────────────────

export async function callOpenAI(
  env: WorkerEnv,
  messages: LLMMessage[],
  opts: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    json?: boolean;
  } = {}
): Promise<LLMResponse> {
  const model = opts.model || 'gpt-4o-mini';
  const request: LLMRequest = {
    model,
    messages,
    temperature: opts.temperature ?? 0.3,
    max_tokens: opts.max_tokens ?? 1000,
    ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${err}`);
  }

  const data = await response.json() as {
    choices: Array<{
      message: { content: string };
      finish_reason: string;
    }>;
    usage: { total_tokens: number };
    model: string;
  };

  return {
    content: data.choices[0]?.message?.content || '',
    tokens_used: data.usage?.total_tokens || 0,
    model: data.model,
    finish_reason: data.choices[0]?.finish_reason || 'stop',
  };
}

// ── ANTHROPIC ─────────────────────────────────────────────────────────────────

export async function callAnthropic(
  env: WorkerEnv,
  messages: LLMMessage[],
  opts: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    systemPrompt?: string;
  } = {}
): Promise<LLMResponse> {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const model = opts.model || 'claude-3-5-haiku-20241022';

  // Separate system message from conversation
  const systemMsg = messages.find(m => m.role === 'system');
  const conversationMsgs = messages.filter(m => m.role !== 'system');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: opts.max_tokens ?? 1000,
      temperature: opts.temperature ?? 0.3,
      system: opts.systemPrompt || systemMsg?.content || 'You are a helpful assistant for Latimore Life & Legacy insurance agency.',
      messages: conversationMsgs.map(m => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${err}`);
  }

  const data = await response.json() as {
    content: Array<{ type: string; text: string }>;
    usage: { input_tokens: number; output_tokens: number };
    model: string;
    stop_reason: string;
  };

  return {
    content: data.content[0]?.text || '',
    tokens_used: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
    model: data.model,
    finish_reason: data.stop_reason || 'end_turn',
  };
}

// ── COST ESTIMATION ───────────────────────────────────────────────────────────

export function estimateCost(model: string, tokens: number): number {
  const rates: Record<string, number> = {
    'gpt-4o': 0.000005,           // $5/1M tokens (blended)
    'gpt-4o-mini': 0.0000003,     // $0.30/1M tokens (blended)
    'gpt-4-turbo': 0.000015,      // $15/1M tokens
    'claude-3-5-haiku-20241022': 0.0000004, // $0.40/1M tokens (blended)
    'claude-3-5-sonnet-20241022': 0.000004, // $4/1M tokens (blended)
  };
  const rate = rates[model] || 0.000001;
  return tokens * rate;
}

// ── PROMPT HELPERS ────────────────────────────────────────────────────────────

export const LATIMORE_SYSTEM_PROMPT = `You are an AI assistant for Latimore Life & Legacy LLC, an independent insurance agency in Schuylkill County, Pennsylvania.

Agency Details:
- Owner: Jackson M. Latimore Sr., MBA
- License: PA DOI #1268820 | NIPR #21638507
- Tagline: "Protecting Today. Securing Tomorrow."
- Carriers: North American, Ethos, American Equity, F&G, Corebridge Financial, Foresters Financial
- Territory: Schuylkill, Luzerne & Northumberland Counties, PA

Your role is to assist with:
1. Lead follow-up message drafting (empathetic, non-pressured, educational)
2. Content creation for social media (Facebook, Instagram, LinkedIn)
3. KPI analysis and reporting
4. Compliance review of marketing materials

CRITICAL COMPLIANCE RULES:
- Never make definitive guarantees about insurance outcomes
- Always use "may", "can", or "could" for outcome statements
- Never quote specific premium amounts without running an official illustration
- Never provide medical or legal advice
- Always recommend consulting with a licensed professional for complex situations
- Maintain dignity-first, preparedness-focused messaging (never fear-based)
- All content must comply with PA DOI regulations

Brand Voice:
- Bold & Confident (we know our products)
- Warm & Relatable (real families, real concerns)
- Educational (teach before we sell)
- Motivational (inspire action, not fear)
- Professional (polished, credible, trustworthy)`;