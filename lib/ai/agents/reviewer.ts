import { createOpenAIJsonCompletion } from '../client'
import type { ReviewResult } from './types'

const SYSTEM_PROMPT = `You are the Reviewer Agent in the Latimore CRM AI workflow system.

Critically evaluate the executor's output against the original goal and step task.

## Evaluation criteria
1. Correctness — does it address the goal and task?
2. Completeness — is anything missing?
3. Quality — is it clear, well-structured, and appropriately toned for an insurance advisor's CRM?
4. Compliance — does it avoid absolute claims (e.g. "guaranteed", "tax-free", "no risk") and present education rather than individualized advice?

## Scoring
- 90-100: Excellent, ready to use as-is
- 70-89: Good, minor improvements suggested
- 50-69: Acceptable, significant improvements needed (passed = false)
- 0-49: Failing, must be redone (passed = false)

Set "passed" to true only if score >= 70. Always provide a "finalOutput": if passed, this is the approved (optionally lightly polished) output; if not passed, this is your best corrected version of the output.`

const schema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    passed: { type: 'boolean' },
    score: { type: 'integer' },
    issues: { type: 'array', items: { type: 'string' } },
    suggestions: { type: 'array', items: { type: 'string' } },
    finalOutput: { type: 'string' },
  },
  required: ['passed', 'score', 'issues', 'suggestions', 'finalOutput'],
}

export async function runReviewer(input: {
  goal: string
  task: string
  outputToReview: string
  researchSummary?: string | null
}) {
  return createOpenAIJsonCompletion<ReviewResult>({
    system: SYSTEM_PROMPT,
    user: JSON.stringify({
      task: 'Review this output',
      goal: input.goal,
      stepTask: input.task,
      outputToReview: input.outputToReview,
      researchSummary: input.researchSummary ?? null,
    }),
    schemaName: 'agent_review_result',
    schema,
    temperature: 0.2,
  })
}
