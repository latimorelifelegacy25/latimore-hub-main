import type { WorkflowDefinition } from '../types';
import { workerRegistry } from '../workers/registry';
import { assertWorkflowDefinition, validateWorkerRegistry } from '../validation';
import { leadFollowUpDefaults, leadFollowUpWorkflow } from './lead-follow-up';
import { noShowRecoveryDefaults, noShowRecoveryWorkflow } from './no-show-recovery';
import { gbpPostDraftDefaults, gbpPostDraftWorkflow } from './gbp-post-draft';
import { weeklyKPIReportDefaults, weeklyKPIReportWorkflow } from './weekly-kpi-report';

export type RegisteredWorkflow = {
  definition: WorkflowDefinition;
  defaults: Record<string, unknown>;
};

const entries: RegisteredWorkflow[] = [
  { definition: leadFollowUpWorkflow, defaults: leadFollowUpDefaults },
  { definition: noShowRecoveryWorkflow, defaults: noShowRecoveryDefaults },
  { definition: gbpPostDraftWorkflow, defaults: gbpPostDraftDefaults },
  { definition: weeklyKPIReportWorkflow, defaults: weeklyKPIReportDefaults },
];

const workerValidation = validateWorkerRegistry(workerRegistry.list());
if (!workerValidation.ok) {
  throw new Error(`Invalid worker registry: ${workerValidation.issues.map(issue => issue.message).join(' | ')}`);
}

for (const entry of entries) {
  assertWorkflowDefinition(entry.definition, workerRegistry.list());
}

const workflowRegistry = new Map(entries.map(entry => [entry.definition.name, entry]));

export function getWorkflow(name: string): RegisteredWorkflow | undefined {
  return workflowRegistry.get(name);
}

export function listWorkflows(): Array<{
  name: string;
  version: string;
  description: string;
  trigger: string;
  stepCount: number;
  complianceRequired: boolean;
}> {
  return entries.map(({ definition }) => ({
    name: definition.name,
    version: definition.version,
    description: definition.description,
    trigger: definition.trigger.type,
    stepCount: definition.steps.length,
    complianceRequired: Boolean(definition.compliance_required),
  }));
}

export function listRegisteredWorkflowNames(): string[] {
  return entries.map(entry => entry.definition.name);
}
