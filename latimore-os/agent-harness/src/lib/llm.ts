/**
 * LLM Client — Claude (Anthropic) primary
 * Thin wrapper with token tracking and error handling
 * Protecting Today. Securing Tomorrow. #TheBeatGoesOn
 */

import type { LLMMessage, LLMResponse, WorkerEnv } from '../types';

// ── ANTHROPIC (primary) ───────────────────────────────────────────────────────

export async function callAnthropic(
  env: WorkerEnv,
  messages: LLMMessage[],
  opts: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    systemPrompt?: string;
    json?: boolean;
  } = {}
): Promise<LLMResponse> {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const model = opts.model || 'claude-sonnet-4-6';

  // Separate system message from conversation
  const systemMsg = messages.find(m => m.role === 'system');
  const conversationMsgs = messages.filter(m => m.role !== 'system');

  const system = opts.systemPrompt || systemMsg?.content || LATIMORE_SYSTEM_PROMPT;

  // If JSON mode requested, append instruction to system prompt
  const finalSystem = opts.json
    ? `${system}\n\nIMPORTANT: Respond with valid JSON only. No markdown fences, no preamble.`
    : system;

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
      system: finalSystem,
      messages: conversationMsgs.map(m => ({
        role: m.role as 'user' | 'assistant',
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

  let text = data.content[0]?.text || '';

  // Strip markdown fences if present (Claude sometimes adds them despite instructions)
  if (opts.json) {
    text = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  }

  return {
    content: text,
    tokens_used: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
    model: data.model,
    finish_reason: data.stop_reason || 'end_turn',
  };
}

// ── ALIAS for drop-in compatibility (replaces all callOpenAI call sites) ──────

/** @deprecated Use callAnthropic directly */
export const callOpenAI = callAnthropic;

// ── COST ESTIMATION ───────────────────────────────────────────────────────────

export function estimateCost(model: string, tokens: number): number {
  const rates: Record<string, number> = {
    'claude-sonnet-4-6':          0.000004,  // $4/1M tokens (blended)
    'claude-haiku-4-5-20251001':  0.0000004, // $0.40/1M tokens (blended)
    'claude-opus-4-6':            0.000015,  // $15/1M tokens (blended)
    // Legacy keys kept for any stored records
    'gpt-4o':                     0.000005,
    'gpt-4o-mini':                0.0000003,
    'claude-3-5-haiku-20241022':  0.0000004,
    'claude-3-5-sonnet-20241022': 0.000004,
  };
  const rate = rates[model] || 0.000004;
  return tokens * rate;
}

// ── SYSTEM PROMPT ─────────────────────────────────────────────────────────────

export const LATIMORE_SYSTEM_PROMPT = `You are an AI assistant for Latimore Life & Legacy LLC, an independent insurance brokerage in Schuylkill County, Pennsylvania.

Agency Details:
- Owner: Jackson M. Latimore Sr., MBA — "Action Jackson"
- License: PA DOI #1268820 | NIPR #21638507
- Affiliated with: Global Financial Impact (GFI)
- Tagline: "Protecting Today. Securing Tomorrow." | #TheBeatGoesOn
- Carriers: North American Company, Corebridge Financial/American General Life, American Equity, F&G, Ethos Life, Foresters Financial
- Territory: Schuylkill, Luzerne & Northumberland Counties, PA
- Business phone: (717) 615-2613
- Admin/leads email: leads@latimorelegacy.com

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
