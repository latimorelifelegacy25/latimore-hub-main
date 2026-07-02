import path from 'node:path'
import fs from 'node:fs/promises'
import vm from 'node:vm'
import { fetchWithTimeout } from './client'
import { prisma } from '@/lib/prisma'

const REPO_ROOT = path.resolve(process.cwd())

const BLOCKED_PATH_SEGMENTS = ['.env', '.git', 'node_modules', '.next', '.vercel']

export type AgentToolName = 'execute_js' | 'read_file' | 'read_database' | 'business_lookup'

export type AgentAction =
  | { type: 'web_search'; queries: string[]; sources: string[] }
  | { type: 'execute_js'; code: string; result: string }
  | { type: 'read_file'; filePath: string; preview: string }
  | { type: 'read_database'; table: string; preview: string }
  | { type: 'business_lookup'; topic: string; preview: string }

export interface AgentTurnResult {
  text: string
  actions: AgentAction[]
}

export interface AgentToolConfig {
  webSearch: boolean
  code: boolean
  files: boolean
  database: boolean
  business: boolean
}

// Allowlist of Prisma models the agent may read, and the field it filters/sorts on by default.
const DATABASE_TABLES: Record<string, { model: keyof typeof prisma; orderBy: string }> = {
  contacts: { model: 'contact', orderBy: 'createdAt' },
  inquiries: { model: 'inquiry', orderBy: 'createdAt' },
  tasks: { model: 'task', orderBy: 'createdAt' },
  appointments: { model: 'appointment', orderBy: 'createdAt' },
  notes: { model: 'note', orderBy: 'createdAt' },
  events: { model: 'event', orderBy: 'createdAt' },
}

async function readDatabaseTable(table: string, filter: Record<string, unknown> | undefined, limit: number): Promise<string> {
  const config = DATABASE_TABLES[table.toLowerCase()]
  if (!config) {
    return `Unknown or disallowed table "${table}". Allowed tables: ${Object.keys(DATABASE_TABLES).join(', ')}.`
  }
  const safeLimit = Math.min(Math.max(1, Math.floor(limit) || 10), 25)
  const delegate = prisma[config.model] as unknown as {
    findMany: (args: Record<string, unknown>) => Promise<unknown[]>
  }
  const rows = await delegate.findMany({
    where: filter && typeof filter === 'object' ? filter : undefined,
    orderBy: { [config.orderBy]: 'desc' },
    take: safeLimit,
  })
  return JSON.stringify(rows, null, 2)
}

const BUSINESS_KNOWLEDGE: Record<string, string> = {
  general:
    'Latimore Life & Legacy LLC | PA DOI #1268820 | NIPR #21638507 | Territory: Schuylkill, Luzerne, Northumberland Counties, PA | GFI Affiliation | Founder: Jackson M. Latimore Sr. | Phone: 717-615-2613.',
  'north american company':
    'North American Company for Life and Health — IUL and fixed annuity carrier appointment. Confirm current product guides and rate sheets with the carrier portal before quoting; this tool does not have live rate data.',
  'corebridge financial':
    'Corebridge Financial (formerly American General Life/AGL) — life and annuity carrier appointment.',
  'american equity':
    'American Equity — fixed indexed annuity carrier appointment.',
  'f&g':
    'F&G (Fidelity & Guaranty Life) — annuity and life carrier appointment.',
  'ethos life':
    'Ethos Life — simplified-issue term and final expense carrier appointment, fast digital underwriting.',
  'foresters financial':
    'Foresters Financial — final expense and whole life carrier appointment with member benefits.',
}

function businessLookup(topic: string, carrier?: string): string {
  const key = (carrier || 'general').toLowerCase()
  const base = BUSINESS_KNOWLEDGE[key] || BUSINESS_KNOWLEDGE.general
  return `${base}\n\nNote: For binding compliance language (e.g. PA DOI suitability/replacement rules) or current product specifics, verify against the carrier's current filed materials — this lookup is a static reference, not a live feed.\n\nTopic requested: ${topic}`
}

function isPathAllowed(relPath: string): boolean {
  const normalized = relPath.replace(/^\/+/, '')
  if (normalized.includes('..')) return false
  return !BLOCKED_PATH_SEGMENTS.some((seg) => normalized.split(path.sep).includes(seg) || normalized.includes(`${seg}/`))
}

async function readRepoFile(relPath: string): Promise<string> {
  if (!isPathAllowed(relPath)) {
    throw new Error(`Access to "${relPath}" is blocked (sensitive or disallowed path).`)
  }
  const resolved = path.resolve(REPO_ROOT, relPath)
  if (!resolved.startsWith(REPO_ROOT)) {
    throw new Error('Path traversal outside the repository is not allowed.')
  }
  const stat = await fs.stat(resolved)
  if (!stat.isFile()) throw new Error(`"${relPath}" is not a file.`)
  if (stat.size > 200_000) throw new Error(`"${relPath}" is too large to read (>200KB).`)
  return fs.readFile(resolved, 'utf8')
}

function runSafeJs(code: string): string {
  const sandbox: Record<string, unknown> = { result: undefined }
  const context = vm.createContext(sandbox, { codeGeneration: { strings: false, wasm: false } })
  const script = new vm.Script(`result = (function() {\n${code}\n})()`)
  script.runInContext(context, { timeout: 1000 })
  const result = sandbox.result
  if (result === undefined) return 'undefined'
  try {
    return typeof result === 'string' ? result : JSON.stringify(result)
  } catch {
    return String(result)
  }
}

const FUNCTION_TOOLS = [
  {
    type: 'function' as const,
    name: 'execute_js',
    description:
      'Execute a short, pure JavaScript snippet for math, logic, or data transforms. No filesystem, network, or process access is available inside the sandbox. Return the value via `return`.',
    parameters: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'JavaScript code. The last expression should be returned with `return`.' },
      },
      required: ['code'],
      additionalProperties: false,
    },
  },
  {
    type: 'function' as const,
    name: 'read_file',
    description: 'Read a text file from the repository by its path relative to the project root, e.g. "lib/ai/client.ts".',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Repo-relative file path.' },
      },
      required: ['path'],
      additionalProperties: false,
    },
  },
  {
    type: 'function' as const,
    name: 'read_database',
    description:
      `Read recent rows from the Latimore Hub CRM database. Allowed tables: ${Object.keys(DATABASE_TABLES).join(', ')}.`,
    parameters: {
      type: 'object',
      properties: {
        table: { type: 'string', description: `Table to query (one of: ${Object.keys(DATABASE_TABLES).join(', ')}).` },
        filter: {
          type: 'object',
          description: 'Optional exact-match field filters, e.g. { "stage": "Qualified" }.',
          additionalProperties: true,
        },
        limit: { type: 'number', description: 'Max rows to return (default 10, max 25).' },
      },
      required: ['table'],
      additionalProperties: false,
    },
  },
  {
    type: 'function' as const,
    name: 'business_lookup',
    description:
      'Look up static Latimore Life & Legacy business reference info: carrier appointments, territory, and compliance contacts.',
    parameters: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'What to look up.' },
        carrier: {
          type: 'string',
          description: 'Specific carrier name, or omit for general info.',
        },
      },
      required: ['topic'],
      additionalProperties: false,
    },
  },
]

// Shared executor for the local (non-web-search) tools, used by both provider loops.
async function executeLocalTool(
  name: string,
  args: Record<string, unknown>,
  actions: AgentAction[],
): Promise<string> {
  try {
    if (name === 'execute_js') {
      const code = String(args.code ?? '')
      const result = runSafeJs(code)
      actions.push({ type: 'execute_js', code, result })
      return result
    }
    if (name === 'read_file') {
      const filePath = String(args.path ?? '')
      const content = await readRepoFile(filePath)
      const preview = content.length > 4000 ? `${content.slice(0, 4000)}\n…(truncated)` : content
      actions.push({ type: 'read_file', filePath, preview })
      return preview
    }
    if (name === 'read_database') {
      const table = String(args.table ?? '')
      // The Gemini declaration passes the filter as a JSON string; OpenAI passes an object.
      let filter: Record<string, unknown> | undefined
      if (typeof args.filter === 'string' && args.filter.trim()) {
        try {
          filter = JSON.parse(args.filter)
        } catch {
          filter = undefined
        }
      } else if (args.filter && typeof args.filter === 'object') {
        filter = args.filter as Record<string, unknown>
      }
      const limit = Number(args.limit ?? 10)
      const preview = await readDatabaseTable(table, filter, limit)
      actions.push({ type: 'read_database', table, preview })
      return preview
    }
    if (name === 'business_lookup') {
      const topic = String(args.topic ?? '')
      const carrier = args.carrier ? String(args.carrier) : undefined
      const preview = businessLookup(topic, carrier)
      actions.push({ type: 'business_lookup', topic, preview })
      return preview
    }
    return `Unknown tool: ${name}`
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : String(error)}`
  }
}

export async function runAgentTurn(input: {
  system: string
  message: string
  history: Array<{ role: 'user' | 'assistant'; text: string }>
  tools: AgentToolConfig
}): Promise<AgentTurnResult> {
  const provider = (process.env.AI_PROVIDER ?? 'openai').toLowerCase()
  const useGemini =
    (provider === 'gemini' && Boolean(process.env.GEMINI_API_KEY)) ||
    (!process.env.OPENAI_API_KEY && Boolean(process.env.GEMINI_API_KEY))

  if (useGemini) return runGeminiAgentTurn(input)
  return runOpenAiAgentTurn(input)
}

async function runOpenAiAgentTurn(input: {
  system: string
  message: string
  history: Array<{ role: 'user' | 'assistant'; text: string }>
  tools: AgentToolConfig
}): Promise<AgentTurnResult> {
  if (!process.env.OPENAI_API_KEY) throw new Error('Missing OPENAI_API_KEY')
  const model = process.env.OPENAI_MODEL ?? 'gpt-4.1-mini'

  const tools: Array<Record<string, unknown>> = []
  if (input.tools.webSearch) tools.push({ type: 'web_search_preview' })
  if (input.tools.code) tools.push(FUNCTION_TOOLS[0])
  if (input.tools.files) tools.push(FUNCTION_TOOLS[1])
  if (input.tools.database) tools.push(FUNCTION_TOOLS[2])
  if (input.tools.business) tools.push(FUNCTION_TOOLS[3])

  const apiInput: Array<Record<string, unknown>> = [
    { role: 'system', content: [{ type: 'input_text', text: input.system }] },
    ...input.history.slice(-10).map((m) => ({
      role: m.role,
      content: [{ type: m.role === 'user' ? 'input_text' : 'output_text', text: m.text }],
    })),
    { role: 'user', content: [{ type: 'input_text', text: input.message }] },
  ]

  const actions: AgentAction[] = []
  let finalText = ''

  for (let round = 0; round < 5; round++) {
    const res = await fetchWithTimeout('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        input: apiInput,
        tools: tools.length > 0 ? tools : undefined,
      }),
      cache: 'no-store',
    })

    const json = await res.json().catch(() => null)
    if (!res.ok) throw new Error(json?.error?.message ?? 'OpenAI agent request failed')

    const output: Array<Record<string, unknown>> = json?.output ?? []
    const functionCalls = output.filter((item) => item.type === 'function_call')
    const webSearchCalls = output.filter((item) => item.type === 'web_search_call')
    const messageItems = output.filter((item) => item.type === 'message')

    if (webSearchCalls.length > 0) {
      const queries = webSearchCalls
        .map((c) => (c.action as Record<string, unknown> | undefined)?.query)
        .filter((q): q is string => typeof q === 'string')
      const sources = output
        .flatMap((item) => (item.content as Array<Record<string, unknown>> | undefined) ?? [])
        .flatMap((c) => (c.annotations as Array<Record<string, unknown>> | undefined) ?? [])
        .map((a) => (typeof a.url === 'string' ? a.url : null))
        .filter((u): u is string => Boolean(u))
      actions.push({ type: 'web_search', queries, sources: [...new Set(sources)] })
    }

    for (const item of messageItems) {
      const content = (item.content as Array<Record<string, unknown>> | undefined) ?? []
      const textPart = content.find((c) => c.type === 'output_text')
      if (textPart && typeof textPart.text === 'string') finalText = textPart.text
    }

    if (functionCalls.length === 0) {
      break
    }

    apiInput.push(...output)

    for (const call of functionCalls) {
      const name = call.name as string
      const callId = call.call_id as string
      let args: Record<string, unknown> = {}
      try {
        args = JSON.parse((call.arguments as string) ?? '{}')
      } catch {
        args = {}
      }

      const toolOutput = await executeLocalTool(name, args, actions)

      apiInput.push({
        type: 'function_call_output',
        call_id: callId,
        output: toolOutput,
      })
    }
  }

  return { text: finalText || 'No response produced.', actions }
}

// ─── Gemini agent loop ────────────────────────────────────────────────────────

// Gemini's function-calling schema is stricter than OpenAI's: no
// additionalProperties, OBJECT params need non-empty properties, and enum-style
// uppercase type names. Declarations are therefore maintained separately, with
// the read_database filter passed as a JSON string instead of a free object.
const GEMINI_FUNCTION_DECLARATIONS: Record<string, Record<string, unknown>> = {
  execute_js: {
    name: 'execute_js',
    description:
      'Execute a short, pure JavaScript snippet for math, logic, or data transforms. No filesystem, network, or process access is available inside the sandbox. Return the value via `return`.',
    parameters: {
      type: 'OBJECT',
      properties: {
        code: { type: 'STRING', description: 'JavaScript code. The last expression should be returned with `return`.' },
      },
      required: ['code'],
    },
  },
  read_file: {
    name: 'read_file',
    description: 'Read a text file from the repository by its path relative to the project root, e.g. "lib/ai/client.ts".',
    parameters: {
      type: 'OBJECT',
      properties: {
        path: { type: 'STRING', description: 'Repo-relative file path.' },
      },
      required: ['path'],
    },
  },
  read_database: {
    name: 'read_database',
    description: `Read recent rows from the Latimore Hub CRM database. Allowed tables: ${Object.keys(DATABASE_TABLES).join(', ')}.`,
    parameters: {
      type: 'OBJECT',
      properties: {
        table: { type: 'STRING', description: `Table to query (one of: ${Object.keys(DATABASE_TABLES).join(', ')}).` },
        filter: {
          type: 'STRING',
          description: 'Optional exact-match field filters as a JSON object string, e.g. "{\\"stage\\": \\"Qualified\\"}".',
        },
        limit: { type: 'NUMBER', description: 'Max rows to return (default 10, max 25).' },
      },
      required: ['table'],
    },
  },
  business_lookup: {
    name: 'business_lookup',
    description:
      'Look up static Latimore Life & Legacy business reference info: carrier appointments, territory, and compliance contacts.',
    parameters: {
      type: 'OBJECT',
      properties: {
        topic: { type: 'STRING', description: 'What to look up.' },
        carrier: { type: 'STRING', description: 'Specific carrier name, or omit for general info.' },
      },
      required: ['topic'],
    },
  },
  web_search: {
    name: 'web_search',
    description:
      'Search the live web for current information and return a grounded summary with source URLs. Use for anything time-sensitive (rates, news, trends).',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: { type: 'STRING', description: 'The web search query.' },
      },
      required: ['query'],
    },
  },
}

function geminiModelName(): string {
  // gemini-2.0-flash is the function-calling default; 1.5-flash (the chat
  // default in client.ts) uses the older search tool name, handled below.
  return process.env.GEMINI_MODEL ?? 'gemini-2.0-flash'
}

function geminiUrl(model: string): string {
  const normalized = model.startsWith('models/') ? model : `models/${model}`
  return `https://generativelanguage.googleapis.com/v1beta/${normalized}:generateContent?key=${process.env.GEMINI_API_KEY}`
}

// Gemini can't mix Google Search grounding with function declarations in one
// request, so web_search is a function tool whose implementation is a second,
// search-grounded Gemini call.
async function geminiWebSearch(query: string): Promise<{ summary: string; sources: string[] }> {
  const model = geminiModelName()
  const searchTool = model.includes('gemini-1.5')
    ? { google_search_retrieval: {} }
    : { google_search: {} }

  const res = await fetchWithTimeout(geminiUrl(model), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: query }] }],
      tools: [searchTool],
    }),
    cache: 'no-store',
  })
  const json = await res.json().catch(() => null)
  if (!res.ok) throw new Error(`Gemini web search failed (${res.status}): ${JSON.stringify(json)}`)

  const candidate = json?.candidates?.[0]
  const summary: string = (candidate?.content?.parts ?? [])
    .map((p: Record<string, unknown>) => (typeof p.text === 'string' ? p.text : ''))
    .join('')
  const chunks: Array<Record<string, unknown>> = candidate?.groundingMetadata?.groundingChunks ?? []
  const sources = chunks
    .map((c) => (c.web as Record<string, unknown> | undefined)?.uri)
    .filter((u): u is string => typeof u === 'string')
  return { summary: summary || 'No results returned.', sources: [...new Set(sources)] }
}

async function runGeminiAgentTurn(input: {
  system: string
  message: string
  history: Array<{ role: 'user' | 'assistant'; text: string }>
  tools: AgentToolConfig
}): Promise<AgentTurnResult> {
  if (!process.env.GEMINI_API_KEY) throw new Error('Missing GEMINI_API_KEY')
  const model = geminiModelName()

  const declarations: Array<Record<string, unknown>> = []
  if (input.tools.code) declarations.push(GEMINI_FUNCTION_DECLARATIONS.execute_js)
  if (input.tools.files) declarations.push(GEMINI_FUNCTION_DECLARATIONS.read_file)
  if (input.tools.database) declarations.push(GEMINI_FUNCTION_DECLARATIONS.read_database)
  if (input.tools.business) declarations.push(GEMINI_FUNCTION_DECLARATIONS.business_lookup)
  if (input.tools.webSearch) declarations.push(GEMINI_FUNCTION_DECLARATIONS.web_search)

  const contents: Array<Record<string, unknown>> = [
    ...input.history.slice(-10).map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    })),
    { role: 'user', parts: [{ text: input.message }] },
  ]

  const actions: AgentAction[] = []
  let finalText = ''

  for (let round = 0; round < 5; round++) {
    const res = await fetchWithTimeout(geminiUrl(model), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: input.system }] },
        contents,
        ...(declarations.length > 0 ? { tools: [{ functionDeclarations: declarations }] } : {}),
      }),
      cache: 'no-store',
    })

    const json = await res.json().catch(() => null)
    if (!res.ok) {
      throw new Error(json?.error?.message ?? `Gemini agent request failed (${res.status})`)
    }

    const parts: Array<Record<string, unknown>> = json?.candidates?.[0]?.content?.parts ?? []
    const functionCalls = parts.filter((p) => p.functionCall)
    const textParts = parts.filter((p) => typeof p.text === 'string')

    if (textParts.length > 0) {
      finalText = textParts.map((p) => p.text as string).join('')
    }

    if (functionCalls.length === 0) break

    contents.push({ role: 'model', parts })

    const responseParts: Array<Record<string, unknown>> = []
    for (const part of functionCalls) {
      const call = part.functionCall as { name?: string; args?: Record<string, unknown> }
      const name = String(call.name ?? '')
      const args = call.args && typeof call.args === 'object' ? call.args : {}

      let toolOutput: string
      if (name === 'web_search') {
        const query = String(args.query ?? '')
        try {
          const { summary, sources } = await geminiWebSearch(query)
          actions.push({ type: 'web_search', queries: [query], sources })
          toolOutput = sources.length > 0 ? `${summary}\n\nSources:\n${sources.join('\n')}` : summary
        } catch (error) {
          toolOutput = `Error: ${error instanceof Error ? error.message : String(error)}`
        }
      } else {
        toolOutput = await executeLocalTool(name, args, actions)
      }

      responseParts.push({
        functionResponse: { name, response: { result: toolOutput } },
      })
    }

    contents.push({ role: 'user', parts: responseParts })
  }

  return { text: finalText || 'No response produced.', actions }
}
