/**
 * LATIMORE OS — WORKFLOW ORCHESTRATOR
 * Plans, executes, and reviews agent workflows
 * Protecting Today. Securing Tomorrow. #TheBeatGoesOn
 */

import type {
  WorkflowDefinition, WorkflowRun, StepRun, WorkflowContext,
  StepDefinition, WorkerOutput, WorkerEnv
} from './types';
import { createDBClient } from './lib/supabase';
import { estimateCost } from './lib/llm';
import { workerRegistry } from './workers/registry';
import { ComplianceReviewer } from './workers/compliance-reviewer';

export class WorkflowOrchestrator {
  private env: WorkerEnv;
  private db: ReturnType<typeof createDBClient>;
  private complianceReviewer: ComplianceReviewer;

  constructor(env: WorkerEnv) {
    this.env = env;
    this.db = createDBClient(env);
    this.complianceReviewer = new ComplianceReviewer();
  }

  // ── PUBLIC: Run a workflow ─────────────────────────────────────────────────

  async run(
    definition: WorkflowDefinition,
    triggerType: string,
    triggerPayload: Record<string, unknown>
  ): Promise<WorkflowRun> {
    const runId = crypto.randomUUID();
    const startedAt = new Date();

    console.log(`[Orchestrator] Starting workflow: ${definition.name} (run: ${runId})`);

    // Initialize run record in DB
    const dbRun = await this.db.workflowRuns.create({
      id: runId,
      workflow_name: definition.name,
      workflow_version: definition.version,
      trigger_type: triggerType,
      trigger_payload: triggerPayload,
      status: 'running',
      started_at: startedAt.toISOString(),
      steps: [],
      context: {},
      output: {},
      tokens_used: 0,
      estimated_cost: 0,
    });

    // Initialize workflow run state
    const run: WorkflowRun = {
      id: runId,
      workflow_name: definition.name,
      workflow_version: definition.version,
      trigger_type: triggerType,
      trigger_payload: triggerPayload,
      status: 'running',
      started_at: startedAt,
      steps: [],
      context: {
        run_id: runId,
        workflow_name: definition.name,
        trigger_type: triggerType,
        contact_id: triggerPayload.contact_id as string | undefined,
        agent_id: triggerPayload.agent_id as string | undefined,
        ...triggerPayload,
      },
      output: {},
      tokens_used: 0,
      estimated_cost: 0,
    };

    try {
      // Plan execution order (resolve dependencies)
      const executionPlan = this.planExecution(definition.steps);
      console.log(`[Orchestrator] Execution plan: ${executionPlan.map(g => g.map(s => s.id).join(',')).join(' → ')}`);

      // Execute steps in dependency order
      for (const stepGroup of executionPlan) {
        if (stepGroup.length === 1) {
          // Single step — execute directly
          await this.executeStep(run, stepGroup[0], definition);
        } else {
          // Multiple independent steps — execute in parallel
          console.log(`[Orchestrator] Parallel execution: ${stepGroup.map(s => s.id).join(', ')}`);
          await Promise.allSettled(
            stepGroup.map(step => this.executeStep(run, step, definition))
          );
        }

        // Check if any critical step failed
        const failedCritical = run.steps.find(
          s => s.status === 'failed' && !definition.steps.find(d => d.id === s.step_id)?.retry_on_failure
        );
        if (failedCritical) {
          throw new Error(`Critical step failed: ${failedCritical.step_id} — ${failedCritical.error}`);
        }
      }

      // Run compliance review if required
      if (definition.compliance_required) {
        const complianceResult = await this.runComplianceReview(run);
        run.compliance_passed = complianceResult.passed;
        run.compliance_notes = complianceResult.notes;

        if (!complianceResult.passed) {
          const criticalViolations = complianceResult.violations.filter(v => v.severity === 'critical');
          if (criticalViolations.length > 0) {
            throw new Error(`Compliance check failed: ${criticalViolations.map(v => v.rule).join(', ')}`);
          }
        }
      }

      // Mark as completed
      run.status = 'completed';
      run.completed_at = new Date();
      run.duration_ms = run.completed_at.getTime() - startedAt.getTime();

      console.log(`[Orchestrator] Workflow completed: ${definition.name} (${run.duration_ms}ms, ${run.tokens_used} tokens)`);

    } catch (err) {
      run.status = 'failed';
      run.error = String(err);
      run.completed_at = new Date();
      run.duration_ms = run.completed_at.getTime() - startedAt.getTime();

      console.error(`[Orchestrator] Workflow failed: ${definition.name}`, err);
    }

    // Update DB record
    await this.db.workflowRuns.update(runId, {
      status: run.status,
      completed_at: run.completed_at?.toISOString(),
      duration_ms: run.duration_ms,
      steps: run.steps,
      output: run.output,
      error: run.error,
      compliance_passed: run.compliance_passed,
      compliance_notes: run.compliance_notes,
      tokens_used: run.tokens_used,
      estimated_cost: run.estimated_cost,
    });

    return run;
  }

  // ── PRIVATE: Plan execution order ─────────────────────────────────────────

  private planExecution(steps: StepDefinition[]): StepDefinition[][] {
    const groups: StepDefinition[][] = [];
    const completed = new Set<string>();
    const remaining = [...steps];

    while (remaining.length > 0) {
      // Find all steps whose dependencies are satisfied
      const ready = remaining.filter(step => {
        const deps = step.depends_on || [];
        return deps.every(dep => completed.has(dep));
      });

      if (ready.length === 0) {
        // Circular dependency or missing dependency — add remaining as-is
        console.warn('[Orchestrator] Possible circular dependency, adding remaining steps');
        groups.push(remaining.splice(0));
        break;
      }

      // Add ready steps as a parallel group
      groups.push(ready);
      ready.forEach(step => {
        completed.add(step.id);
        const idx = remaining.findIndex(s => s.id === step.id);
        if (idx !== -1) remaining.splice(idx, 1);
      });
    }

    return groups;
  }

  // ── PRIVATE: Execute a single step ────────────────────────────────────────

  private async executeStep(
    run: WorkflowRun,
    stepDef: StepDefinition,
    workflowDef: WorkflowDefinition
  ): Promise<void> {
    const stepRun: StepRun = {
      step_id: stepDef.id,
      step_name: stepDef.name,
      worker: stepDef.worker,
      status: 'running',
      started_at: new Date(),
      input: {},
      retry_count: 0,
    };

    run.steps.push(stepRun);

    if (stepDef.skip_if && this.evaluateCondition(stepDef.skip_if, run.context)) {
      stepRun.status = 'skipped';
      stepRun.completed_at = new Date();
      console.log(`[Orchestrator] Step skipped: ${stepDef.id}`);
      return;
    }

    // Bounded retry loop — reuses the same StepRun across attempts so
    // retry_count actually accumulates (a prior recursive version created a
    // fresh StepRun with retry_count reset to 0 on every retry, so a
    // permanently-failing step retried forever instead of stopping at
    // max_retries).
    const maxAttempts = stepDef.retry_on_failure ? (workflowDef.max_retries || 1) + 1 : 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      stepRun.retry_count = attempt - 1;
      stepRun.status = 'running';

      try {
        const input = this.buildStepInput(stepDef, run.context);
        stepRun.input = input;

        const worker = workerRegistry.get(stepDef.worker);
        if (!worker) {
          throw new Error(`Worker not found: ${stepDef.worker}`);
        }

        const timeout = stepDef.timeout_ms || workflowDef.timeout_ms || 30000;
        const output = await this.withTimeout(
          worker.execute({ context: run.context, step: stepDef, ...input }, this.env),
          timeout,
          `Step ${stepDef.id} timed out after ${timeout}ms`
        );

        if (!output.success) {
          throw new Error(output.error || `Worker ${stepDef.worker} returned failure`);
        }

        // Store output in context
        if (stepDef.output_key && output.data) {
          run.context[stepDef.output_key] = output.data;
        }

        // Track token usage
        if (output.tokens_used) {
          run.tokens_used += output.tokens_used;
          run.estimated_cost += estimateCost('gemini-2.5-flash-lite', output.tokens_used);
        }

        stepRun.status = 'completed';
        stepRun.output = output.data;
        stepRun.tokens_used = output.tokens_used;
        stepRun.completed_at = new Date();
        stepRun.duration_ms = stepRun.completed_at.getTime() - stepRun.started_at!.getTime();

        console.log(`[Orchestrator] Step completed: ${stepDef.id} (${stepRun.duration_ms}ms)`);
        return;

      } catch (err) {
        stepRun.status = 'failed';
        stepRun.error = String(err);
        stepRun.completed_at = new Date();
        stepRun.duration_ms = stepRun.completed_at!.getTime() - stepRun.started_at!.getTime();

        console.error(`[Orchestrator] Step failed: ${stepDef.id}`, err);

        if (attempt < maxAttempts) {
          console.log(`[Orchestrator] Retrying step: ${stepDef.id} (attempt ${attempt})`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
  }

  // ── PRIVATE: Build step input from context ────────────────────────────────

  private buildStepInput(
    stepDef: StepDefinition,
    context: WorkflowContext
  ): Record<string, unknown> {
    if (!stepDef.input_map) return { ...context };

    const input: Record<string, unknown> = {};
    for (const [inputKey, contextKey] of Object.entries(stepDef.input_map)) {
      input[inputKey] = this.resolveContextPath(context, contextKey);
    }
    return input;
  }

  // input_map values like 'contact_profile.contact_summary' or 'draft.body' are
  // dotted paths into nested step outputs, not flat context keys — walk them.
  private resolveContextPath(context: WorkflowContext, path: string): unknown {
    return path.split('.').reduce<unknown>((value, key) => {
      if (value && typeof value === 'object' && key in (value as Record<string, unknown>)) {
        return (value as Record<string, unknown>)[key];
      }
      return undefined;
    }, context);
  }

  // ── PRIVATE: Evaluate skip condition ─────────────────────────────────────

  private evaluateCondition(condition: string, context: WorkflowContext): boolean {
    try {
      // Simple key existence check: "!context.email" or "context.has_life_insurance"
      if (condition.startsWith('!')) {
        const key = condition.slice(1).replace('context.', '');
        return !context[key];
      }
      const key = condition.replace('context.', '');
      return !!context[key];
    } catch {
      return false;
    }
  }

  // ── PRIVATE: Compliance review ────────────────────────────────────────────

  private async runComplianceReview(run: WorkflowRun) {
    console.log(`[Orchestrator] Running compliance review for: ${run.workflow_name}`);

    // Collect all text outputs from steps
    const textOutputs: string[] = [];
    for (const step of run.steps) {
      if (step.output) {
        const outputStr = JSON.stringify(step.output);
        if (outputStr.length > 10) textOutputs.push(outputStr);
      }
    }

    if (textOutputs.length === 0) {
      return { passed: true, violations: [], warnings: [], notes: 'No text output to review' };
    }

    return this.complianceReviewer.execute(
      { context: run.context, step: { id: 'compliance', name: 'Compliance Review', worker: 'ComplianceReviewer' }, content: textOutputs.join('\n\n') },
      this.env
    ).then(result => {
      if (result.success && result.data) {
        return result.data as { passed: boolean; violations: Array<{ rule: string; severity: string }>; warnings: string[]; notes: string };
      }
      return { passed: true, violations: [], warnings: [], notes: 'Compliance review skipped' };
    });
  }

  // ── PRIVATE: Timeout wrapper ──────────────────────────────────────────────

  private withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(message)), ms)
      ),
    ]);
  }
}