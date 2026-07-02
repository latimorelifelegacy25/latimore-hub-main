type JsonSchema = Record<string, unknown>

type CompletionResult<T> = {
  model: string
  output: T
  usage?: {
    input_tokens?: number
    output_tokens?: number
    total_tokens?: number
  }
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<Response> {
  const { timeoutMs = Number(process.env.AI_FETCH_TIMEOUT_MS ?? 30000), signal, ...fetchInit } = init
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  if (signal) {
    if (signal.aborted) controller.abort()
    else signal.addEventListener('abort', () => controller.abort(), { once: true })
  }

  try {
    return await fetch(input, { ...fetchInit, signal: controller.signal })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`AI provider request timed out after ${timeoutMs}ms`)
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

function getAiProvider() {
  return (process.env.AI_PROVIDER ?? 'openai').toLowerCase()
}

// ─── Plain-text completion ────────────────────────────────────────────────────
export async function createTextCompletion({
  system,
  user,
  temperature = 0.7,
}: {
  system: string
  user: string
  temperature?: number
}): Promise<string> {
  const provider = getAiProvider()
  if (provider === 'anthropic') return createAnthropicTextCompletion({ system, user, temperature })
  if (provider === 'gemini') return createGeminiTextCompletion({ system, user, temperature })
  return createOpenAiTextCompletion({ system, user, temperature })
}

async function createAnthropicTextCompletion({
  system,
  user,
  temperature,
}: {
  system: string
  user: string
  temperature: number
}): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('Missing ANTHROPIC_API_KEY')
  const model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6'
  const res = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      temperature,
      system,
      messages: [{ role: 'user', content: user }],
    }),
    cache: 'no-store',
  })
  const json = await res.json().catch(() => null)
  if (!res.ok) throw new Error(json?.error?.message ?? 'Anthropic request failed')
  const text = json?.content?.[0]?.text
  if (!text) throw new Error('Anthropic returned empty output')
  return text as string
}

async function createOpenAiTextCompletion({
  system,
  user,
  temperature,
}: {
  system: string
  user: string
  temperature: number
}): Promise<string> {
  if (!process.env.OPENAI_API_KEY) throw new Error('Missing OPENAI_API_KEY')
  const model = process.env.OPENAI_MODEL ?? 'gpt-4.1-mini'
  const res = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model, temperature, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }),
    cache: 'no-store',
  })
  const json = await res.json().catch(() => null)
  if (!res.ok) throw new Error(json?.error?.message ?? 'OpenAI request failed')
  const text = json?.choices?.[0]?.message?.content
  if (!text) throw new Error('OpenAI returned empty output')
  return text as string
}

async function createGeminiTextCompletion({
  system,
  user,
  temperature,
}: {
  system: string
  user: string
  temperature: number
}): Promise<string> {
  if (!process.env.GEMINI_API_KEY) throw new Error('Missing GEMINI_API_KEY')
  const model = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash'
  const normalizedModel = model.startsWith('models/') ? model : `models/${model}`
  const res = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/${normalizedModel}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: { temperature },
      }),
      cache: 'no-store',
    }
  )
  const json = await res.json().catch(() => null)
  if (!res.ok) throw new Error(`Gemini request failed (${res.status}): ${JSON.stringify(json)}`)
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini returned empty output')
  return text as string
}
// ─────────────────────────────────────────────────────────────────────────────

// ─── JSON schema completion ───────────────────────────────────────────────────
export async function createOpenAIJsonCompletion<T>({
  model,
  system,
  user,
  schemaName,
  schema,
  temperature = 0.2,
}: {
  model?: string
  system: string
  user: string
  schemaName: string
  schema: JsonSchema
  temperature?: number
}): Promise<CompletionResult<T>> {
  const provider = getAiProvider()

  if (provider === 'anthropic') {
    return createAnthropicJsonCompletion<T>({
      model: model ?? process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
      system,
      user,
      schemaName,
      schema,
      temperature,
    })
  }

  if (provider === 'gemini') {
    return createGeminiJsonCompletion<T>({
      model: model ?? process.env.GEMINI_MODEL ?? 'gemini-2.0-flash',
      system,
      user,
      schemaName,
      schema,
      temperature,
    })
  }

  return createOpenAiProviderJsonCompletion<T>({
    model: model ?? process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
    system,
    user,
    schemaName,
    schema,
    temperature,
  })
}

async function createAnthropicJsonCompletion<T>({
  model,
  system,
  user,
  schemaName,
  schema,
  temperature = 0.2,
}: {
  model: string
  system: string
  user: string
  schemaName: string
  schema: JsonSchema
  temperature: number
}): Promise<CompletionResult<T>> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Missing ANTHROPIC_API_KEY')
  }

  const jsonPrompt = [
    user,
    '',
    `Return ONLY valid JSON matching schema "${schemaName}". No markdown fences, no commentary, no extra keys.`,
    '',
    'JSON Schema:',
    JSON.stringify(schema),
  ].join('\n')

  const response = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      temperature,
      system,
      messages: [{ role: 'user', content: jsonPrompt }],
    }),
    cache: 'no-store',
  })

  const json = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(json?.error?.message ?? 'Anthropic request failed')
  }

  const text = json?.content?.[0]?.text
  if (!text || typeof text !== 'string') {
    throw new Error('Anthropic returned empty output')
  }

  // Strip any accidental markdown fences
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

  let parsed: T
  try {
    parsed = JSON.parse(cleaned) as T
  } catch {
    throw new Error(`Anthropic returned invalid JSON: ${cleaned.slice(0, 200)}`)
  }

  return {
    model: json?.model ?? model,
    output: parsed,
    usage: {
      input_tokens: json?.usage?.input_tokens,
      output_tokens: json?.usage?.output_tokens,
      total_tokens: (json?.usage?.input_tokens ?? 0) + (json?.usage?.output_tokens ?? 0),
    },
  }
}

async function createOpenAiProviderJsonCompletion<T>({
  model,
  system,
  user,
  schemaName,
  schema,
  temperature = 0.2,
}: {
  model: string
  system: string
  user: string
  schemaName: string
  schema: JsonSchema
  temperature?: number
}): Promise<CompletionResult<T>> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY')
  }

  const response = await fetchWithTimeout('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      temperature,
      input: [
        { role: 'system', content: [{ type: 'input_text', text: system }] },
        { role: 'user', content: [{ type: 'input_text', text: user }] },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: schemaName,
          strict: true,
          schema,
        },
      },
    }),
    cache: 'no-store',
  })

  const json = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(json?.error?.message ?? 'OpenAI request failed')
  }

  const text =
    json?.output_text ??
    json?.output
      ?.flatMap((item: any) => item?.content ?? [])
      ?.find((c: any) => c?.type === 'output_text')
      ?.text

  if (!text || typeof text !== 'string') {
    throw new Error('OpenAI returned empty output')
  }

  return {
    model: json?.model ?? model,
    output: JSON.parse(text) as T,
    usage: json?.usage,
  }
}

async function createGeminiJsonCompletion<T>({
  model,
  system,
  user,
  schemaName,
  schema,
  temperature = 0.2,
}: {
  model: string
  system: string
  user: string
  schemaName: string
  schema: JsonSchema
  temperature?: number
}): Promise<CompletionResult<T>> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY')
  }

  const prompt = [
    system,
    '',
    `Return ONLY valid JSON for schema "${schemaName}". Do not include markdown fences or commentary.`,
    '',
    'JSON Schema:',
    JSON.stringify(schema),
    '',
    'User request:',
    user,
  ].join('\n')

  const normalizedModel = model.startsWith('models/') ? model : `models/${model}`

  const response = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/${normalizedModel}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        generationConfig: {
          temperature,
          responseMimeType: 'application/json',
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      }),
      cache: 'no-store',
    }
  )

  const rawText = await response.text()
  let json: any = null

  try {
    json = rawText ? JSON.parse(rawText) : null
  } catch {
    json = null
  }

  if (!response.ok) {
    throw new Error(
      `Gemini request failed (${response.status} ${response.statusText}): ${rawText || 'empty response'}`
    )
  }

  const text =
    json?.candidates?.[0]?.content?.parts
      ?.map((part: any) => part?.text ?? '')
      .join('') ?? ''

  if (!text || typeof text !== 'string') {
    throw new Error('Gemini returned empty output')
  }

  let parsed: T
  try {
    parsed = JSON.parse(text) as T
  } catch {
    throw new Error(`Gemini returned invalid JSON: ${text}`)
  }

  return {
    model,
    output: parsed,
    usage: {
      input_tokens: json?.usageMetadata?.promptTokenCount,
      output_tokens: json?.usageMetadata?.candidatesTokenCount,
      total_tokens: json?.usageMetadata?.totalTokenCount,
    },
  }
}
