/**
 * POST /api/admin/ai/agent
 * Real tool-calling agent mode: web search, sandboxed JS execution, read-only repo
 * file and CRM database access. Runs on OpenAI or Gemini depending on AI_PROVIDER
 * and available keys. All execution happens server-side — no client API keys.
 */

export const dynamic = 'force-dynamic'

import { runAgentTurn } from '@/lib/ai/agent-runtime'
import { requireAdminSession, withAdminAiGuardrails } from '@/lib/ai/shared'

const SYSTEM_PROMPT = withAdminAiGuardrails(
  `You are Nexus Agent Mode, a tool-using assistant inside the Latimore Hub admin workspace.
You have optional tools available: web search, a sandboxed JavaScript executor (no filesystem/network access inside it), read-only access to repository files, read-only access to the CRM database, and a static business/carrier reference lookup.
Only use a tool when it is actually needed to answer the request. Explain your reasoning briefly before tool calls when helpful, and always give a clear final answer. When asked to write a document (proposal, email, report, compliance note, client summary), just write it directly in your final answer — no tool call is needed for that.`
)

export async function POST(req: Request) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  try {
    const body = await req.json()
    const { message, history = [], tools = {} } = body

    if (!message?.trim()) {
      return Response.json({ error: 'message is required' }, { status: 400 })
    }

    const result = await runAgentTurn({
      system: SYSTEM_PROMPT,
      message,
      history: Array.isArray(history) ? history : [],
      tools: {
        webSearch: Boolean(tools.webSearch),
        code: Boolean(tools.code),
        files: Boolean(tools.files),
        database: Boolean(tools.database),
        business: Boolean(tools.business),
      },
    })

    return Response.json({ reply: result.text, actions: result.actions })
  } catch (error) {
    console.error('[/api/admin/ai/agent] Error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Agent request failed' },
      { status: 500 }
    )
  }
}
