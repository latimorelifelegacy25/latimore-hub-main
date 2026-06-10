import { createOpenAIJsonCompletion } from '../client'
import type { ExecutionPlan } from './types'

const SYSTEM_PROMPT = `You are the Planner Agent in the Latimore CRM AI workflow system.

Decompose the goal into 2-5 concrete, ordered steps. Assign each step to exactly one agent role:
- "researcher": gather and summarize relevant information from the provided context only (no live web access)
- "executor": produce a concrete written output (e.g. a draft message, summary, plan, or document)
- "reviewer": critique an executor's output against the goal and provide a final, polished version

A typical workflow is researcher -> executor -> reviewer, but adapt to the goal. Keep steps specific and grounded only in the provided context.`

const schema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    reasoning: { type: 'string' },
    steps: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          order: { type: 'integer' },
          agentRole: { type: 'string', enum: ['researcher', 'executor', 'reviewer'] },
          task: { type: 'string' },
          expectedOutput: { type: 'string' },
        },
        required: ['order', 'agentRole', 'task', 'expectedOutput'],
      },
    },
  },
  required: ['reasoning', 'steps'],
}

export async function runPlanner(goal: string, context?: Record<string, unknown> | null) {
  return createOpenAIJsonCompletion<ExecutionPlan>({
    system: SYSTEM_PROMPT,
    user: JSON.stringify({ task: 'Create an execution plan for this goal', goal, context: context ?? null }),
    schemaName: 'agent_execution_plan',
    schema,
    temperature: 0.2,
  })
}
