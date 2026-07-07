import { SENTIMENT_SYSTEM_PROMPT, SentimentResult, safeParseSentiment } from './sentiment'

export type ModelProvider = 'gemini' | 'gemini-flash'

export type AnalyzeOptions = {
  preferredProvider?: ModelProvider
  forceProvider?: ModelProvider
  escalationAllowed?: boolean
}

export type AnalyzeResponse = {
  provider: string
  model: string
  latencyMs: number
  result: SentimentResult
  rawText: string
}

/**
 * Cost-first routing: Gemini Flash-Lite → Gemini Flash → local heuristic
 * All AI calls use GEMINI_API_KEY (Google AI Studio)
 */
export async function analyzeSentimentWithRouter(
  text: string,
  options: AnalyzeOptions = {}
): Promise<AnalyzeResponse> {
  const started = Date.now()
  const forceProvider = options.forceProvider

  // forceProvider override
  if (forceProvider === 'gemini-flash') {
    try {
      return await callGeminiFlash(text)
    } catch {
      return localHeuristicAnalysis(text, started)
    }
  }

  // Default cascade: Flash-Lite first
  try {
    const first = await callGeminiLite(text)
    if (first.result.confidence >= 0.65 || !options.escalationAllowed) return first
  } catch {
    // fall through to Flash
  }

  try {
    return await callGeminiFlash(text)
  } catch {
    return localHeuristicAnalysis(text, started)
  }
}

function localHeuristicAnalysis(text: string, started: number): AnalyzeResponse {
  const lowered = text.toLowerCase()
  const pos = ['great', 'thanks', 'helpful', 'love', 'excellent', 'interested'].some(t => lowered.includes(t))
  const neg = ['bad', 'angry', 'upset', 'scam', 'wrong', 'complaint', 'cancel'].some(t => lowered.includes(t))
  const purchase = ['cost', 'price', 'quote', 'appointment', 'call', 'coverage', 'policy'].some(t => lowered.includes(t))

  const result: SentimentResult = {
    sentiment: neg ? 'negative' : pos ? 'positive' : 'neutral',
    confidence: 0.52,
    intent: purchase ? 'purchase_interest' : lowered.includes('?') ? 'question' : 'other',
    urgency: neg || purchase ? 'medium' : 'low',
    topics: purchase ? ['insurance inquiry'] : ['general engagement'],
    trending_terms: [],
    lead_potential: purchase ? 'medium' : 'low',
    compliance_risk: lowered.includes('guarantee') || lowered.includes('return') ? 'medium' : 'none',
    recommended_action: purchase
      ? 'Review the comment and follow up with a consultation CTA.'
      : 'Monitor and respond if appropriate.',
  }

  return {
    provider: 'local',
    model: 'local-heuristic-fallback',
    latencyMs: Date.now() - started,
    result,
    rawText: JSON.stringify(result),
  }
}

async function callGeminiLite(text: string): Promise<AnalyzeResponse> {
  const started = Date.now()
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY not configured')
  const model = process.env.GEMINI_SENTIMENT_MODEL || 'gemini-2.0-flash-lite'
  return callGeminiModel(key, model, text, started)
}

async function callGeminiFlash(text: string): Promise<AnalyzeResponse> {
  const started = Date.now()
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY not configured')
  const model = process.env.GEMINI_FLASH_SENTIMENT_MODEL || 'gemini-2.0-flash'
  return callGeminiModel(key, model, text, started)
}

async function callGeminiModel(
  key: string,
  model: string,
  text: string,
  started: number
): Promise<AnalyzeResponse> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SENTIMENT_SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text }] }],
        generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
      }),
    }
  )
  if (!res.ok) throw new Error(`Gemini ${model} ${res.status}`)
  const json = await res.json()
  const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
  return {
    provider: 'gemini',
    model,
    latencyMs: Date.now() - started,
    result: safeParseSentiment(rawText),
    rawText,
  }
}
