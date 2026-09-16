import type { WorkflowDefinition, StepDefinition } from './types';

export type ValidationIssue = {
  code: string;
  message: string;
  stepId?: string;
};

export type WorkflowValidationResult = {
  ok: boolean;
  issues: ValidationIssue[];
};

function isPositiveFinite(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function validateStepShape(step: StepDefinition, index: number): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const label = step.id || `steps[${index}]`;

  if (!step.id?.trim()) issues.push({ code: 'STEP_ID_REQUIRED', message: `Step ${index + 1} is missing an id.` });
  if (!step.name?.trim()) issues.push({ code: 'STEP_NAME_REQUIRED', message: `Step ${label} is missing a name.`, stepId: step.id });
  if (!step.worker?.trim()) issues.push({ code: 'STEP_WORKER_REQUIRED', message: `Step ${label} is missing a worker.`, stepId: step.id });
  if (step.timeout_ms !== undefined && !isPositiveFinite(step.timeout_ms)) {
    issues.push({ code: 'STEP_TIMEOUT_INVALID', message: `Step ${label} timeout_ms must be a positive finite number.`, stepId: step.id });
  }

  return issues;
}

function detectCycles(steps: StepDefinition[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const byId = new Map(steps.map(step => [step.id, step]));
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (id: string, path: string[]) => {
    if (visiting.has(id)) {
      const cycleStart = path.indexOf(id);
      const cycle = [...path.slice(cycleStart), id].join(' -> ');
      issues.push({ code: 'WORKFLOW_CYCLE', message: `Circular dependency detected: ${cycle}`, stepId: id });
      return;
    }
    if (visited.has(id)) return;

    const step = byId.get(id);
    if (!step) return;

    visiting.add(id);
    for (const dep of step.depends_on ?? []) visit(dep, [...path, id]);
    visiting.delete(id);
    visited.add(id);
  };

  for (const step of steps) visit(step.id, []);
  return issues;
}

export function validateWorkflowDefinition(
  definition: WorkflowDefinition,
  registeredWorkers: readonly string[],
): WorkflowValidationResult {
  const issues: ValidationIssue[] = [];

  if (!definition.name?.trim()) issues.push({ code: 'WORKFLOW_NAME_REQUIRED', message: 'Workflow name is required.' });
  if (!definition.version?.trim()) issues.push({ code: 'WORKFLOW_VERSION_REQUIRED', message: `Workflow ${definition.name || '(unnamed)'} is missing a version.` });
  if (!definition.description?.trim()) issues.push({ code: 'WORKFLOW_DESCRIPTION_REQUIRED', message: `Workflow ${definition.name || '(unnamed)'} is missing a description.` });
  if (!definition.trigger?.type) issues.push({ code: 'WORKFLOW_TRIGGER_REQUIRED', message: `Workflow ${definition.name || '(unnamed)'} is missing a trigger type.` });
  if (!Array.isArray(definition.steps) || definition.steps.length === 0) {
    issues.push({ code: 'WORKFLOW_STEPS_REQUIRED', message: `Workflow ${definition.name || '(unnamed)'} must define at least one step.` });
    return { ok: false, issues };
  }
  if (definition.timeout_ms !== undefined && !isPositiveFinite(definition.timeout_ms)) {
    issues.push({ code: 'WORKFLOW_TIMEOUT_INVALID', message: `Workflow ${definition.name} timeout_ms must be a positive finite number.` });
  }
  if (definition.max_retries !== undefined && (!Number.isInteger(definition.max_retries) || definition.max_retries < 0)) {
    issues.push({ code: 'WORKFLOW_RETRIES_INVALID', message: `Workflow ${definition.name} max_retries must be a non-negative integer.` });
  }

  const ids = new Set<string>();
  const workerSet = new Set(registeredWorkers);

  definition.steps.forEach((step, index) => {
    issues.push(...validateStepShape(step, index));

    if (step.id) {
      if (ids.has(step.id)) issues.push({ code: 'STEP_ID_DUPLICATE', message: `Duplicate step id: ${step.id}`, stepId: step.id });
      ids.add(step.id);
    }

    if (step.worker && !workerSet.has(step.worker)) {
      issues.push({ code: 'WORKER_NOT_REGISTERED', message: `Step ${step.id || index + 1} references unregistered worker ${step.worker}.`, stepId: step.id });
    }
  });

  for (const step of definition.steps) {
    for (const dep of step.depends_on ?? []) {
      if (!ids.has(dep)) {
        issues.push({ code: 'DEPENDENCY_MISSING', message: `Step ${step.id} depends on missing step ${dep}.`, stepId: step.id });
      }
      if (dep === step.id) {
        issues.push({ code: 'SELF_DEPENDENCY', message: `Step ${step.id} cannot depend on itself.`, stepId: step.id });
      }
    }
  }

  if (!issues.some(issue => ['DEPENDENCY_MISSING', 'SELF_DEPENDENCY', 'STEP_ID_DUPLICATE'].includes(issue.code))) {
    issues.push(...detectCycles(definition.steps));
  }

  return { ok: issues.length === 0, issues };
}

export function assertWorkflowDefinition(
  definition: WorkflowDefinition,
  registeredWorkers: readonly string[],
): void {
  const result = validateWorkflowDefinition(definition, registeredWorkers);
  if (result.ok) return;

  const detail = result.issues.map(issue => `${issue.code}: ${issue.message}`).join(' | ');
  throw new Error(`Invalid workflow definition ${definition.name || '(unnamed)'}: ${detail}`);
}

export function validateWorkerRegistry(registeredWorkers: readonly string[]): WorkflowValidationResult {
  const issues: ValidationIssue[] = [];
  const seen = new Set<string>();

  for (const name of registeredWorkers) {
    if (!name?.trim()) {
      issues.push({ code: 'WORKER_NAME_REQUIRED', message: 'Worker registry contains an empty worker name.' });
      continue;
    }
    if (seen.has(name)) issues.push({ code: 'WORKER_NAME_DUPLICATE', message: `Duplicate worker registration: ${name}` });
    seen.add(name);
  }

  return { ok: issues.length === 0, issues };
}
