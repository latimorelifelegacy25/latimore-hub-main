/**
 * LATIMORE OS — AGENT HARNESS TYPES
 * Shared type definitions for the LLM orchestration layer
 */

// ── WORKFLOW TYPES ────────────────────────────────────────────────────────────

export type WorkflowStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface WorkflowDefinition {
  name: string;
  version: string;
  description: string;
  trigger: WorkflowTrigger;
  steps: StepDefinition[];
  timeout_ms?: number;
  max_retries?: number;
  compliance_required?: boolean;
}

export interface WorkflowTrigger {
  type: 'lead_created' | 'scheduled' | 'manual' | 'webhook' | 'fillout_submission' | 'booking_created' | 'no_show';
  conditions?: Record<string, unknown>;
}

export interface StepDefinition {
  id: string;
  name: string;
  worker: string;           // worker class name
  depends_on?: string[];    // step IDs this step depends on
  input_map?: Record<string, string>; // maps workflow context keys to worker input keys
  output_key?: string;      // key to store output in workflow context
  timeout_ms?: number;
  retry_on_failure?: boolean;
  skip_if?: string;         // condition expression to skip this step
}

// ── EXECUTION TYPES ───────────────────────────────────────────────────────────

export interface WorkflowRun {
  id: string;
  workflow_name: string;
  workflow_version: string;
  trigger_type: string;
  trigger_payload: Record<string, unknown>;
  status: WorkflowStatus;
  started_at?: Date;
  completed_at?: Date;
  duration_ms?: number;
  steps: StepRun[];
  context: WorkflowContext;
  output: Record<string, unknown>;
  error?: string;
  compliance_passed?: boolean;
  compliance_notes?: string;
  tokens_used: number;
  estimated_cost: number;
}

export interface StepRun {
  step_id: string;
  step_name: string;
  worker: string;
  status: StepStatus;
  started_at?: Date;
  completed_at?: Date;
  duration_ms?: number;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  tokens_used?: number;
  retry_count: number;
}

export interface WorkflowContext {
  run_id: string;
  workflow_name: string;
  trigger_type: string;
  contact_id?: string;
  agent_id?: string;
  [key: string]: unknown;  // dynamic context from step outputs
}

// ── WORKER TYPES ──────────────────────────────────────────────────────────────

export interface WorkerInput {
  context: WorkflowContext;
  step: StepDefinition;
  [key: string]: unknown;
}

export interface WorkerOutput {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  tokens_used?: number;
  actions_taken?: string[];
}

export abstract class BaseWorker {
  abstract name: string;
  abstract description: string;
  abstract execute(input: WorkerInput, env: WorkerEnv): Promise<WorkerOutput>;

  protected log(message: string, data?: unknown): void {
    console.log(`[${this.name}] ${message}`, data ? JSON.stringify(data) : '');
  }

  protected error(message: string, err?: unknown): void {
    console.error(`[${this.name}] ERROR: ${message}`, err);
  }
}

// ── ENVIRONMENT ───────────────────────────────────────────────────────────────

export interface WorkerEnv {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  ANTHROPIC_API_KEY: string;
  RESEND_API_KEY: string;
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
  TWILIO_PHONE_NUMBER: string;
  HUB_URL: string;
}

// ── LLM TYPES ─────────────────────────────────────────────────────────────────

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMRequest {
  model: string;
  messages: LLMMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: 'json_object' | 'text' };
}

export interface LLMResponse {
  content: string;
  tokens_used: number;
  model: string;
  finish_reason: string;
}

// ── COMPLIANCE TYPES ──────────────────────────────────────────────────────────

export interface ComplianceCheck {
  passed: boolean;
  violations: ComplianceViolation[];
  warnings: string[];
  notes: string;
}

export interface ComplianceViolation {
  rule: string;
  severity: 'critical' | 'major' | 'minor';
  description: string;
  content_excerpt?: string;
}

// ── CONTACT / CRM TYPES ───────────────────────────────────────────────────────

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  lead_status: string;
  lead_source?: string;
  annual_income?: number;
  existing_coverage?: number;
  retirement_savings?: number;
  has_life_insurance?: boolean;
  has_annuity?: boolean;
  smoker?: boolean;
  health_rating?: string;
  notes?: string;
  tags?: string[];
}

export interface Policy {
  id: string;
  contact_id: string;
  carrier: string;
  policy_type: string;
  product_name?: string;
  status: string;
  face_amount?: number;
  premium_monthly?: number;
  deposit_amount?: number;
}
