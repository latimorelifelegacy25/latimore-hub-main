import { runPlanner } from './planner'
import { runResearcher } from './researcher'
import { runExecutor } from './executor'
import { runReviewer } from './reviewer'
import type { AgentStepLog, AgentWorkflowResult, ExecutionResult, ResearchResult, ReviewResult } from './types'

export interface AgentWorkflowUsage {
  model?: string
  tokensInput: number
  tokensOutput: number
}

export interface AgentWorkflowRunResult {
  result: AgentWorkflowResult
  usage: AgentWorkflowUsage
}

const MAX_RETRIES_CAP = 2

export interface AgentWorkflowStepHooks {
  onStepStart?: (step: { order: number; agentRole: string; task: string }) => Promise<unknown>
  onStepSuccess?: (step: { order: number; agentRole: string; task: string; handle: unknown; output: unknown }) => Promise<unknown>
  onStepFailure?: (step: { order: number; agentRole: string; task: string; handle: unknown; error: unknown }) => Promise<unknown>
}

export async function runAgentWorkflow(
  input: {
    goal: string
    context?: Record<string, unknown> | null
    maxRetries?: number
  },
  hooks?: AgentWorkflowStepHooks
): Promise<AgentWorkflowRunResult> {
  const maxRetries = Math.min(Math.max(input.maxRetries ?? 1, 0), MAX_RETRIES_CAP)
  const usage: AgentWorkflowUsage = { tokensInput: 0, tokensOutput: 0 }

  function track(completion: { model: string; usage?: { input_tokens?: number; output_tokens?: number } }) {
    usage.model = completion.model
    usage.tokensInput += completion.usage?.input_tokens ?? 0
    usage.tokensOutput += completion.usage?.output_tokens ?? 0
  }

  async function runStep<T>(
    step: { order: number; agentRole: string; task: string },
    fn: () => Promise<T>
  ): Promise<T> {
    const handle = await hooks?.onStepStart?.(step)
    try {
      const output = await fn()
      await hooks?.onStepSuccess?.({ ...step, handle, output })
      return output
    } catch (error) {
      await hooks?.onStepFailure?.({ ...step, handle, error })
      throw error
    }
  }

  const planCompletion = await runPlanner(input.goal, input.context)
  track(planCompletion)
  const plan = planCompletion.output
  const sortedSteps = [...plan.steps].sort((a, b) => a.order - b.order)

  const steps: AgentStepLog[] = []
  let researchSummary: string | null = null
  let executionOutput: string | null = null
  let finalOutput = ''

  for (const step of sortedSteps) {
    if (step.agentRole === 'researcher') {
      const output: ResearchResult = await runStep(step, async () => {
        const completion = await runResearcher(step.task, input.context)
        track(completion)
        return completion.output
      })
      researchSummary = output.summary
      steps.push({ order: step.order, agentRole: step.agentRole, task: step.task, output })
      finalOutput = output.summary
      continue
    }

    if (step.agentRole === 'executor') {
      const output: ExecutionResult = await runStep(step, async () => {
        const completion = await runExecutor(step.task, input.context, researchSummary)
        track(completion)
        return completion.output
      })
      executionOutput = output.output
      steps.push({ order: step.order, agentRole: step.agentRole, task: step.task, output })
      finalOutput = output.output
      continue
    }

    // reviewer
    let reviewOutput: ReviewResult | null = null
    let attempt = 0
    let outputToReview = executionOutput ?? finalOutput ?? 'No execution output was produced for review.'

    reviewOutput = await runStep(step, async () => {
      let latest: ReviewResult
      while (true) {
        const reviewCompletion = await runReviewer({
          goal: input.goal,
          task: step.task,
          outputToReview,
          researchSummary,
        })
        track(reviewCompletion)
        latest = reviewCompletion.output

        if (latest.passed || attempt === maxRetries) break

        attempt++
        const retryTask = `${step.task}\n\nThe previous attempt failed review (score: ${latest.score}/100).\nIssues:\n${latest.issues.join('\n')}\nSuggestions:\n${latest.suggestions.join('\n')}\n\nProduce an improved version that addresses this feedback.`
        const retryCompletion = await runExecutor(retryTask, input.context, researchSummary)
        track(retryCompletion)
        executionOutput = retryCompletion.output.output
        outputToReview = executionOutput
      }
      return latest
    })

    if (reviewOutput) {
      steps.push({ order: step.order, agentRole: step.agentRole, task: step.task, output: reviewOutput })
      finalOutput = reviewOutput.finalOutput
    }
  }

  return {
    result: {
      goal: input.goal,
      plan,
      steps,
      finalOutput: finalOutput || executionOutput || 'No output produced',
    },
    usage,
  }
}
