export type AgentRole = 'researcher' | 'executor' | 'reviewer'

export interface PlanStep {
  order: number
  agentRole: AgentRole
  task: string
  expectedOutput: string
}

export interface ExecutionPlan {
  reasoning: string
  steps: PlanStep[]
}

export interface ResearchResult {
  summary: string
  findings: string[]
  caveats: string[]
}

export interface ExecutionResult {
  output: string
  success: boolean
  notes: string
}

export interface ReviewResult {
  passed: boolean
  score: number
  issues: string[]
  suggestions: string[]
  finalOutput: string
}

export interface AgentStepLog {
  order: number
  agentRole: AgentRole
  task: string
  output: ResearchResult | ExecutionResult | ReviewResult
}

export interface AgentWorkflowResult {
  goal: string
  plan: ExecutionPlan
  steps: AgentStepLog[]
  finalOutput: string
}
