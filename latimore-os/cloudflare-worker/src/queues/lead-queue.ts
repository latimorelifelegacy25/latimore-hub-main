/**
 * Lead Queue Consumer
 * Processes canonical Inquiry queue messages.
 */

import type { Env } from '../index';
import { createSupabaseClient } from '../lib/supabase';

interface LeadQueueMessage {
  lead_id: string;
  contact_id?: string;
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
  _ctx: ExecutionContext,
): Promise<void> {
  const db = createSupabaseClient(env);

  for (const message of batch.messages) {
    try {
      const payload = message.body as LeadQueueMessage;
      console.log(`[LeadQueue] Processing canonical inquiry: ${payload.lead_id}`);

      let contactId = payload.contact_id || null;
      if (payload.lead_id) {
        const inquiry = await db.from('Inquiry').select('id,contactId').eq('id', payload.lead_id).single();
        if (inquiry.error) throw new Error(`Inquiry lookup failed: ${inquiry.error.message}`);
        if (inquiry.data) contactId = (inquiry.data as { contactId: string }).contactId;
      }

      const task = await db.from('Task').insert({
        contactId,
        inquiryId: payload.lead_id || null,
        title: `Follow up with ${payload.first_name} ${payload.last_name}`,
        description: `New inquiry from ${payload.source}. Interest: ${payload.interest || 'General'}`,
        status: 'Open',
        dueAt: new Date(Date.now() + 24 * 3600000).toISOString(),
      });
      if (task.error) throw new Error(`Task create failed: ${task.error.message}`);

      const event = await db.from('SystemEvent').insert({
        type: 'lead.queue.processed',
        contactId,
        inquiryId: payload.lead_id || null,
        source: 'lead-intake-queue',
        payload: { source: payload.source, interest: payload.interest || null },
        occurredAt: new Date().toISOString(),
      });
      if (event.error) console.error('[LeadQueue] SystemEvent write failed:', event.error);

      message.ack();
      console.log(`[LeadQueue] Processed canonical inquiry: ${payload.lead_id}`);
    } catch (err) {
      console.error('[LeadQueue] Error processing message:', err);
      message.retry();
    }
  }
}
