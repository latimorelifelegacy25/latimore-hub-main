/**
 * POST /api/admin/ai/agent
 * Real tool-calling agent mode: web search, sandboxed JS execution, read-only repo
 * file and CRM database access. Runs on OpenAI or Gemini depending on AI_PROVIDER
 * and available keys. All execution happens server-side — no client API keys.
 */

export const dynamic = 'force-dynamic'

import { runAgentTurn, type AgentToolConfig } from '@/lib/ai/agent-runtime'
import { requireAdminSession, withAdminAiGuardrails } from '@/lib/ai/shared'

function normalizeTools(tools: Record<string, unknown>): AgentToolConfig {
  return {
    webSearch: Boolean(tools.webSearch),
    code: Boolean(tools.code),
    files: Boolean(tools.files),
    database: Boolean(tools.database),
    business: Boolean(tools.business),
  }
}

function buildSystemPrompt(tools: AgentToolConfig): string {
  const enabledTools = [
    tools.webSearch
      ? '`web_search` — live web / Google-grounded search for current public information, news, rates, trends, and compliance references that may have changed.'
      : null,
    tools.code
      ? '`execute_js` — sandboxed JavaScript for math, calculations, logic checks, and safe data transforms. No filesystem or network access.'
      : null,
    tools.files
      ? '`read_file` — read-only repository file inspection by repo-relative path.'
      : null,
    tools.database
      ? '`read_database` — read-only Latimore Hub CRM database access for allowed tables only.'
      : null,
    tools.business
      ? '`business_lookup` — static Latimore Life & Legacy business, carrier, territory, and reference lookup.'
      : null,
  ].filter((tool): tool is string => Boolean(tool))

  const disabledTools = [
    !tools.webSearch ? '`web_search`' : null,
    !tools.code ? '`execute_js`' : null,
    !tools.files ? '`read_file`' : null,
    !tools.database ? '`read_database`' : null,
    !tools.business ? '`business_lookup`' : null,
  ].filter((tool): tool is string => Boolean(tool))

  const enabledBlock = enabledTools.length > 0
    ? `Currently enabled tools:\n${enabledTools.map((tool) => `- ${tool}`).join('\n')}`
    : 'Currently enabled tools: none. Answer from existing conversation context only.'

  const disabledBlock = disabledTools.length > 0
    ? `Currently disabled tools: ${disabledTools.join(', ')}. If the user asks for one of these, state that it is disabled in the toolbar and identify the button to enable it. Do not claim you have access to disabled tools.`
    : 'No tools are disabled in the toolbar.'

  return withAdminAiGuardrails(
    `You are Nexus Agent Mode, a tool-using assistant inside the Latimore Hub admin workspace.
${enabledBlock}
${disabledBlock}

Use only the exact tool names listed as enabled above. Do not say a tool is available unless it is listed in the enabled tools block. Only use a tool when it is actually needed to answer the request. When asked for current public information and \`web_search\` is enabled, use \`web_search\` instead of refusing.

When asked to write a document, proposal, email, report, compliance note, client summary, or social post, write it directly in your final answer unless the request specifically requires live web, CRM, repo, code, or business lookup data.`
  )
}

export async function POST(req: Request) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  try {
    const body = await req.json()
    const { message, history = [], tools = {} } = body

    if (!message?.trim()) {
      return Response.json({ error: 'message is required' }, { status: 400 })
    }

    const enabledTools = normalizeTools(tools)

    const result = await runAgentTurn({
      system: buildSystemPrompt(enabledTools),
      message,
      history: Array.isArray(history) ? history : [],
      tools: enabledTools,
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
