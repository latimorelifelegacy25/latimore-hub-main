import type { WorkflowRun, WorkerEnv } from './types';
import { createDBClient } from './lib/supabase';

const SENSITIVE_KEYS = new Set([
  'email', 'phone', 'first_name', 'last_name', 'name', 'dob', 'date_of_birth',
  'ssn', 'social_security_number', 'address', 'street', 'medical', 'health',
  'annual_income', 'monthly_income', 'income', 'coverage_amount', 'retirement_savings',
]);

function maskValue(value: unknown): unknown {
  if (typeof value === 'string') {
    if (value.length <= 4) return '***';
    return `${value.slice(0, 2)}***${value.slice(-2)}`;
  }
  if (typeof value === 'number') return '[masked-number]';
  return '[masked]';
}

export function maskAuditState(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(maskAuditState);
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, child]) => [
      key,
      SENSITIVE_KEYS.has(key.toLowerCase()) ? maskValue(child) : maskAuditState(child),
    ]),
  );
}

export async function recordWorkflowAudit(env: WorkerEnv, run: WorkflowRun): Promise<void> {
  const db = createDBClient(env);
  const action = run.status === 'completed' ? 'workflow.completed' : 'workflow.failed';

  const afterState = maskAuditState({
    workflow_name: run.workflow_name,
    workflow_version: run.workflow_version,
    trigger_type: run.trigger_type,
    status: run.status,
    duration_ms: run.duration_ms ?? null,
    step_count: run.steps.length,
    tokens_used: run.tokens_used,
    estimated_cost: run.estimated_cost,
    compliance_passed: run.compliance_passed ?? null,
    error: run.error ?? null,
  });

  const { error } = await db.raw('audit_log').insert({
    actor_type: 'workflow',
    actor_label: `Latimore OS · ${run.workflow_name}`,
    action,
    entity_type: 'workflow_run',
    entity_id: run.id,
    before_state: null,
    after_state: afterState,
    request_id: run.id,
    is_pii_event: false,
    retention_days: 2555,
  });

  if (error) {
    console.error('[WorkflowAudit] Failed to write audit_log', error);
  }
}
