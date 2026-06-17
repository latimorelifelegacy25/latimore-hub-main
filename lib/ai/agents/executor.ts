import { createOpenAIJsonCompletion } from '../client'
import type { ExecutionResult } from './types'

const SYSTEM_PROMPT = `You are the Executor Agent in the Latimore CRM AI workflow system.

Produce a concrete, usable written output for the given task, grounded in the provided context and any research findings. If the task asks for a draft message, document, summary, or plan, write it out in full.
Report whether you were able to complete the task successfully, and any notes about assumptions or limitations.`

const schema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    output: { type: 'string' },
    success: { type: 'boolean' },
    notes: { type: 'string' },
  },
  required: ['output', 'success', 'notes'],
}

export async function runExecutor(task: string, context?: Record<string, unknown> | null, researchSummary?: string | null) {
  return createOpenAIJsonCompletion<ExecutionResult>({
    system: SYSTEM_PROMPT,
    user: JSON.stringify({
      task: 'Execute this task',
      executionTask: task,
      researchSummary: researchSummary ?? null,
      context: context ?? null,
    }),
    schemaName: 'agent_execution_result',
    schema,
    temperature: 0.3,
  })
}
