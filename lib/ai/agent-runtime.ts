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

export async function runAgentTurn(input: {
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

      let toolOutput: string
      try {
        if (name === 'execute_js') {
          const code = String(args.code ?? '')
          const result = runSafeJs(code)
          actions.push({ type: 'execute_js', code, result })
          toolOutput = result
        } else if (name === 'read_file') {
          const filePath = String(args.path ?? '')
          const content = await readRepoFile(filePath)
          const preview = content.length > 4000 ? `${content.slice(0, 4000)}\n…(truncated)` : content
          actions.push({ type: 'read_file', filePath, preview })
          toolOutput = preview
        } else if (name === 'read_database') {
          const table = String(args.table ?? '')
          const filter = (args.filter as Record<string, unknown> | undefined) ?? undefined
          const limit = Number(args.limit ?? 10)
          const preview = await readDatabaseTable(table, filter, limit)
          actions.push({ type: 'read_database', table, preview })
          toolOutput = preview
        } else if (name === 'business_lookup') {
          const topic = String(args.topic ?? '')
          const carrier = args.carrier ? String(args.carrier) : undefined
          const preview = businessLookup(topic, carrier)
          actions.push({ type: 'business_lookup', topic, preview })
          toolOutput = preview
        } else {
          toolOutput = `Unknown tool: ${name}`
        }
      } catch (error) {
        toolOutput = `Error: ${error instanceof Error ? error.message : String(error)}`
      }

      apiInput.push({
        type: 'function_call_output',
        call_id: callId,
        output: toolOutput,
      })
    }
  }

  return { text: finalText || 'No response produced.', actions }
}
