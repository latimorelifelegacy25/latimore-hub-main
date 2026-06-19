/**
 * LLM Client — Gemini 2.5 Flash-Lite primary
 * Thin wrapper with token tracking and error handling
 * Protecting Today. Securing Tomorrow. #TheBeatGoesOn
 */

import type { LLMMessage, LLMResponse, WorkerEnv } from '../types';

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash-lite';

// ── GEMINI (primary) ──────────────────────────────────────────────────────────

export async function callGemini(
  env: WorkerEnv,
  messages: LLMMessage[],
  opts: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    systemPrompt?: string;
    json?: boolean;
    thinkingBudget?: number;
  } = {}
): Promise<LLMResponse> {
  if (!env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const model = opts.model || DEFAULT_GEMINI_MODEL;

  // Separate system message from conversation
  const systemMsg = messages.find(m => m.role === 'system');
  const conversationMsgs = messages.filter(m => m.role !== 'system');

  const system = opts.systemPrompt || systemMsg?.content || LATIMORE_SYSTEM_PROMPT;
  const finalSystem = opts.json
    ? `${system}\n\nIMPORTANT: Respond with valid JSON only. No markdown fences, no preamble.`
    : system;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'x-goog-api-key': env.GEMINI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: finalSystem }],
        },
        contents: conversationMsgs.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        generationConfig: {
          temperature: opts.temperature ?? 0.3,
          maxOutputTokens: opts.max_tokens ?? 1000,
          ...(opts.json ? { responseMimeType: 'application/json' } : {}),
          // Gemini 2.5 Flash-Lite does not think by default; keep budget at 0 for predictable cost.
          thinkingConfig: {
            thinkingBudget: opts.thinkingBudget ?? 0,
          },
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${err}`);
  }

  const data = await response.json() as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
      finishReason?: string;
    }>;
    usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
      thoughtsTokenCount?: number;
      totalTokenCount?: number;
    };
    modelVersion?: string;
  };

  let text = data.candidates?.[0]?.content?.parts
    ?.map(part => part.text || '')
    .join('') || '';

  // Strip markdown fences if present despite JSON-mode instruction.
  if (opts.json) {
    text = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  }

  return {
    content: text,
    tokens_used: data.usageMetadata?.totalTokenCount || 0,
    model: data.modelVersion || model,
    finish_reason: data.candidates?.[0]?.finishReason || 'STOP',
  };
}

// ── Compatibility aliases so existing worker imports keep compiling ──────────

/** @deprecated Use callGemini directly */
export const callOpenAI = callGemini;

/** @deprecated Use callGemini directly */
export const callAnthropic = callGemini;

// ── COST ESTIMATION ───────────────────────────────────────────────────────────

export function estimateCost(model: string, tokens: number): number {
  const rates: Record<string, number> = {
    // Conservative total-token estimate. Actual Gemini billing separates input ($0.10/M) and output ($0.40/M).
    'gemini-2.5-flash-lite': 0.0000004,
    'gemini-2.5-flash':      0.0000025,
    'gemini-2.5-pro':        0.000010,
    // Legacy keys kept for stored workflow records and older comparisons.
    'claude-sonnet-4-6':          0.000004,
    'claude-haiku-4-5-20251001':  0.0000004,
    'claude-opus-4-6':            0.000015,
    'gpt-4o':                     0.000005,
    'gpt-4o-mini':                0.0000003,
  };
  const rate = rates[model] || rates[DEFAULT_GEMINI_MODEL];
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
