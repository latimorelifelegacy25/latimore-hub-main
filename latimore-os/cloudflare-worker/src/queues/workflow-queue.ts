/**
 * Workflow Queue Consumer
 * Triggers agent harness workflows from queue messages
 */

import type { Env } from '../index';
import { createSupabaseClient } from '../lib/supabase';

interface WorkflowQueueMessage {
  workflow: string;
  trigger: string;
  payload: Record<string, unknown>;
}

export async function processWorkflowQueue(
  batch: MessageBatch,
  env: Env,
  ctx: ExecutionContext
): Promise<void> {
  const db = createSupabaseClient(env);

  // Check if agent harness is enabled
  const harnessEnabled = env.AGENT_HARNESS_ENABLED === 'true';

  for (const message of batch.messages) {
    try {
      const payload = message.body as WorkflowQueueMessage;
      console.log(`[WorkflowQueue] Workflow: ${payload.workflow}, trigger: ${payload.trigger}`);

      if (!harnessEnabled) {
        console.log(`[WorkflowQueue] Agent harness disabled — logging workflow trigger only`);

        // Log the workflow trigger even if harness is disabled
        await db.from('workflow_runs').insert({
          workflow_name: payload.workflow,
          trigger_type: payload.trigger,
          trigger_payload: payload.payload,
          status: 'pending',
          contact_id: (payload.payload.contact_id as string) || null,
        });

        message.ack();
        continue;
      }

      // Forward to Next.js agent harness endpoint
      const hubUrl = env.HUB_URL || 'https://hub.latimorelifelegacy.com';
      const workerSecret = env.WORKER_SECRET;

      const response = await fetch(`${hubUrl}/api/agent/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Worker-Secret': workerSecret,
        },
        body: JSON.stringify({
          workflow: payload.workflow,
          trigger: payload.trigger,
          payload: payload.payload,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[WorkflowQueue] Harness error (${response.status}):`, errorText);
        message.retry();
        continue;
      }

      const result = await response.json() as { run_id?: string; status?: string };
      console.log(`[WorkflowQueue] Workflow started: ${result.run_id} (${payload.workflow})`);

      message.ack();

    } catch (err) {
      console.error(`[WorkflowQueue] Error:`, err);
      message.retry();
    }
  }
}