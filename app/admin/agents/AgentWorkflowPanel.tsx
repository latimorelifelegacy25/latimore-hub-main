'use client'

import { useState, useTransition } from 'react'

type AgentRole = 'researcher' | 'executor' | 'reviewer'

type AgentStepLog = {
  order: number
  agentRole: AgentRole
  task: string
  output: Record<string, unknown>
}

type ExecutionPlan = {
  reasoning: string
  steps: { order: number; agentRole: AgentRole; task: string; expectedOutput: string }[]
}

type AgentWorkflowResult = {
  goal: string
  plan: ExecutionPlan
  steps: AgentStepLog[]
  finalOutput: string
}

type RunResponse = {
  ok: boolean
  result?: AgentWorkflowResult
  error?: string
}

const EXAMPLE_GOALS = [
  'Draft a follow-up plan for re-engaging cold leads in Schuylkill County.',
  'Summarize best practices for explaining IUL policies to new clients and draft a short education email.',
]

function StepCard({ step }: { step: AgentStepLog }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-[#C9A25F]">
          Step {step.order} · {step.agentRole}
        </p>
      </div>
      <p className="mt-1 text-sm text-[#D7DCE5]">{step.task}</p>
      <pre className="mt-2 whitespace-pre-wrap text-xs text-[#E6EAF0]">
        {JSON.stringify(step.output, null, 2)}
      </pre>
    </div>
  )
}

export default function AgentWorkflowPanel() {
  const [goal, setGoal] = useState('')
  const [result, setResult] = useState<AgentWorkflowResult | null>(null)
  const [error, setError] = useState('')
  const [isRunning, startRunning] = useTransition()

  function run(value: string) {
    const trimmed = value.trim()
    if (!trimmed) {
      setError('Enter a goal for the agent workflow')
      return
    }

    setError('')
    setResult(null)

    startRunning(async () => {
      try {
        const res = await fetch('/api/ai/agents/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goal: trimmed }),
        })

        const data: RunResponse = await res.json()

        if (!res.ok || !data.ok || !data.result) {
          setError(data?.error ? JSON.stringify(data.error) : 'Failed to run the agent workflow')
          return
        }

        setResult(data.result)
      } catch {
        setError('Failed to run the agent workflow')
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {EXAMPLE_GOALS.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => {
              setGoal(example)
              run(example)
            }}
            disabled={isRunning}
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-[#D7DCE5] transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {example}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          rows={3}
          placeholder="Describe the goal for the agent team (planner, researcher, executor, reviewer)..."
          className="w-full rounded-xl border border-white/10 bg-[#0F1115] px-4 py-3 text-sm text-white outline-none placeholder:text-[#667085]"
        />
        <button
          type="button"
          onClick={() => run(goal)}
          disabled={isRunning}
          className="shrink-0 rounded-xl bg-[#C9A25F] px-4 py-2 text-sm font-medium text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRunning ? 'Running...' : 'Run Workflow'}
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-[#8F98A8]">Plan</p>
            <p className="mt-1 text-sm text-[#D7DCE5]">{result.plan.reasoning}</p>
          </div>

          <div className="space-y-2">
            {result.steps.map((step) => (
              <StepCard key={step.order} step={step} />
            ))}
          </div>

          <div className="rounded-xl border border-[#C9A25F]/20 bg-[#C9A25F]/5 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-[#C9A25F]">Final Output</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-[#E6EAF0]">{result.finalOutput}</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
