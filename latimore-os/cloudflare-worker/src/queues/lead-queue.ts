/**
 * Lead Queue Consumer
 * Processes lead-intake queue messages
 */

import type { Env } from '../index';
import { createSupabaseClient } from '../lib/supabase';

interface LeadQueueMessage {
  lead_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  source: string;
  interest?: string;
}

export async function processLeadQueue(
  batch: MessageBatch,
  env: Env,
  ctx: ExecutionContext
): Promise<void> {
  const db = createSupabaseClient(env);

  for (const message of batch.messages) {
    try {
      const payload = message.body as LeadQueueMessage;
      console.log(`[LeadQueue] Processing lead: ${payload.lead_id}`);

      // Mark lead as processed
      if (payload.lead_id) {
        await db.from('leads').update({
          is_processed: true,
          processed_at: new Date().toISOString(),
        }).eq('id', payload.lead_id);
      }

      // Create follow-up task
      await db.from('tasks').insert({
        title: `Follow up with ${payload.first_name} ${payload.last_name}`,
        task_type: 'follow_up',
        status: 'pending',
        priority: 'high',
        due_at: new Date(Date.now() + 24 * 3600000).toISOString(), // 24h
        notes: `New lead from ${payload.source}. Interest: ${payload.interest || 'General'}`,
        is_automated: true,
      });

      message.ack();
      console.log(`[LeadQueue] Processed: ${payload.lead_id}`);

    } catch (err) {
      console.error(`[LeadQueue] Error processing message:`, err);
      message.retry();
    }
  }
}