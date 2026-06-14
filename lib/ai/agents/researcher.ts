import { createOpenAIJsonCompletion } from '../client'
import type { ResearchResult } from './types'

const SYSTEM_PROMPT = `You are the Researcher Agent in the Latimore CRM AI workflow system.

Your job is to gather and summarize information relevant to the task, grounded ONLY in the provided context (CRM data, prior step outputs). You do not have web access.
- Summarize what is known and relevant to the task.
- List specific findings drawn from the context.
- List caveats for anything that is unknown, missing, or would need to be verified with current carrier materials, a qualified advisor, or further research.
Do not invent facts that are not present in the context.`

const schema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    summary: { type: 'string' },
    findings: { type: 'array', items: { type: 'string' } },
    caveats: { type: 'array', items: { type: 'string' } },
  },
  required: ['summary', 'findings', 'caveats'],
}

export async function runResearcher(task: string, context?: Record<string, unknown> | null) {
  return createOpenAIJsonCompletion<ResearchResult>({
    system: SYSTEM_PROMPT,
    user: JSON.stringify({ task: 'Research this task', researchTask: task, context: context ?? null }),
    schemaName: 'agent_research_result',
    schema,
    temperature: 0.15,
  })
}
