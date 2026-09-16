/**
 * CRM Worker
 * Writes only to the canonical Prisma-managed Latimore CRM data core.
 */

import { BaseWorker } from '../types';
import type { WorkerInput, WorkerOutput, WorkerEnv } from '../types';
import { createDBClient } from '../lib/supabase';

export class CRMWorker extends BaseWorker {
  name = 'CRMWorker';
  description = 'Updates canonical Contact/Task/Appointment/ContentAsset records';

  async execute(input: WorkerInput, env: WorkerEnv): Promise<WorkerOutput> {
    const db = createDBClient(env);
    const action = (input.action as string) || 'update_contact';
    const contactId = (input.contact_id as string) || (input.context.contact_id as string) || '';
    const actionsTaken: string[] = [];

    this.log(`Canonical CRM action: ${action} for contact: ${contactId || 'none'}`);

    try {
      switch (action) {
        case 'update_contact':
          await this.updateContact(db, contactId, input, actionsTaken);
          break;
        case 'create_task':
          await this.createTask(db, contactId, input, actionsTaken);
          break;
        case 'advance_pipeline':
          await this.advancePipeline(db, contactId, input, actionsTaken);
          break;
        case 'mark_no_show':
          await this.markNoShow(db, contactId, input, actionsTaken);
          break;
        case 'close_won':
          await this.closeWon(db, contactId, input, actionsTaken);
          break;
        case 'close_lost':
          await this.closeLost(db, contactId, input, actionsTaken);
          break;
        case 'tag_contact':
          await this.tagContact(db, contactId, input, actionsTaken);
          break;
        case 'store_content_post':
          await this.storeContentPost(db, input, actionsTaken);
          break;
        default:
          return { success: false, error: `Unknown CRM action: ${action}` };
      }

      return {
        success: true,
        data: { action, contact_id: contactId || null, actions_taken: actionsTaken },
        actions_taken: actionsTaken,
      };
    } catch (err) {
      this.error(`CRM action failed: ${action}`, err);
      return { success: false, error: String(err) };
    }
  }

  private async updateContact(
    db: ReturnType<typeof createDBClient>,
    contactId: string,
    input: WorkerInput,
    actions: string[],
  ): Promise<void> {
    if (!contactId) return;

    const updates: Record<string, unknown> = {};
    if (input.lead_status) updates.lead_status = input.lead_status;
    if (input.next_follow_up_at) updates.next_follow_up_at = input.next_follow_up_at;
    if (input.last_contacted_at) updates.last_contacted_at = input.last_contacted_at;
    if (input.notes) updates.notes = input.notes;

    if (Object.keys(updates).length > 0) {
      await db.contacts.update(contactId, updates);
      actions.push('canonical_contact_updated');
    }
  }

  private async createTask(
    db: ReturnType<typeof createDBClient>,
    contactId: string,
    input: WorkerInput,
    actions: string[],
  ): Promise<void> {
    const dueHours = Number(input.due_hours || 24);
    const dueAt = new Date(Date.now() + dueHours * 3600000).toISOString();

    await db.tasks.create({
      contact_id: contactId || null,
      inquiry_id: input.inquiry_id ?? input.context.inquiry_id ?? null,
      title: (input.task_title as string) || 'Follow up with contact',
      description: (input.task_description as string) || null,
      task_type: (input.task_type as string) || 'follow_up',
      status: 'Open',
      priority: (input.priority as string) || 'medium',
      due_at: dueAt,
      is_automated: true,
      workflow_run_id: (input.context.run_id as string) || null,
    });

    actions.push('canonical_task_created');
  }

  private async advancePipeline(
    db: ReturnType<typeof createDBClient>,
    contactId: string,
    input: WorkerInput,
    actions: string[],
  ): Promise<void> {
    if (!contactId) return;
    const contact = await db.contacts.findById(contactId);
    if (!contact) return;

    const currentStatus = String(contact.lead_status || 'new').toLowerCase();
    const nextStatus = String(input.next_status || getNextStatus(currentStatus)).toLowerCase();

    if (nextStatus && nextStatus !== currentStatus) {
      await db.contacts.update(contactId, {
        lead_status: nextStatus,
        last_contacted_at: new Date().toISOString(),
      });
      actions.push(`canonical_pipeline_advanced:${currentStatus}→${nextStatus}`);
    }
  }

  private async markNoShow(
    db: ReturnType<typeof createDBClient>,
    contactId: string,
    input: WorkerInput,
    actions: string[],
  ): Promise<void> {
    const appointmentId = input.appointment_id as string;

    if (appointmentId) {
      const result = await db.raw('Appointment')
        .update({ status: 'no_show' })
        .eq('id', appointmentId)
        .execute();
      if (result.error) throw new Error(`Appointment update failed: ${JSON.stringify(result.error)}`);
      actions.push('canonical_appointment_marked_no_show');
    }

    if (contactId) {
      await db.contacts.update(contactId, {
        lead_status: 'contacted',
        next_follow_up_at: new Date(Date.now() + 2 * 3600000).toISOString(),
      });
      actions.push('canonical_contact_recovery_scheduled');
    }

    await db.tasks.create({
      contact_id: contactId || null,
      title: `No-show recovery: ${(input.contact_name as string) || 'Contact'}`,
      description: 'Automated recovery task created by Latimore OS.',
      task_type: 'follow_up',
      status: 'Open',
      priority: 'high',
      due_at: new Date(Date.now() + 2 * 3600000).toISOString(),
      is_automated: true,
      workflow_run_id: (input.context.run_id as string) || null,
    });
    actions.push('canonical_recovery_task_created');
  }

  private async closeWon(
    db: ReturnType<typeof createDBClient>,
    contactId: string,
    input: WorkerInput,
    actions: string[],
  ): Promise<void> {
    if (!contactId) return;

    await db.contacts.update(contactId, {
      lead_status: 'closed_won',
      last_contacted_at: new Date().toISOString(),
      next_follow_up_at: new Date(Date.now() + 7 * 24 * 3600000).toISOString(),
    });
    actions.push('canonical_contact_closed_won');

    await db.tasks.create({
      contact_id: contactId,
      title: `Referral ask: ${(input.contact_name as string) || 'Client'}`,
      description: 'Send referral request — 7 days post-close.',
      task_type: 'follow_up',
      status: 'Open',
      priority: 'medium',
      due_at: new Date(Date.now() + 7 * 24 * 3600000).toISOString(),
      is_automated: true,
      workflow_run_id: (input.context.run_id as string) || null,
    });
    actions.push('canonical_referral_task_created');
  }

  private async closeLost(
    db: ReturnType<typeof createDBClient>,
    contactId: string,
    input: WorkerInput,
    actions: string[],
  ): Promise<void> {
    if (!contactId) return;

    await db.contacts.update(contactId, {
      lead_status: 'closed_lost',
      next_follow_up_at: new Date(Date.now() + 90 * 24 * 3600000).toISOString(),
      notes: (input.loss_reason as string) || 'Closed lost',
    });
    actions.push('canonical_contact_closed_lost');

    await db.tasks.create({
      contact_id: contactId,
      title: `90-day nurture check-in: ${(input.contact_name as string) || 'Contact'}`,
      description: 'Nurture follow-up — circumstances may have changed.',
      task_type: 'follow_up',
      status: 'Open',
      priority: 'low',
      due_at: new Date(Date.now() + 90 * 24 * 3600000).toISOString(),
      is_automated: true,
      workflow_run_id: (input.context.run_id as string) || null,
    });
    actions.push('canonical_nurture_task_created');
  }

  private async tagContact(
    db: ReturnType<typeof createDBClient>,
    contactId: string,
    input: WorkerInput,
    actions: string[],
  ): Promise<void> {
    if (!contactId) return;
    const tags = Array.isArray(input.tags) ? input.tags.map(String) : [];
    if (!tags.length) return;

    const result = await db.raw('SystemEvent').insert({
      type: 'workflow.contact.tagged',
      contactId,
      source: 'agent_harness',
      payload: { tags, workflow_run_id: input.context.run_id ?? null },
      occurredAt: new Date().toISOString(),
    });
    if (result.error) throw new Error(`Contact tag event failed: ${JSON.stringify(result.error)}`);
    actions.push(`canonical_contact_tag_event:${tags.join(',')}`);
  }

  private async storeContentPost(
    db: ReturnType<typeof createDBClient>,
    input: WorkerInput,
    actions: string[],
  ): Promise<void> {
    const draft = (input.draft as Record<string, unknown>) || {};
    const compliance = (input.compliance as Record<string, unknown>) || {};
    const topic = String(input.topic || 'Latimore educational content');
    const platform = String(input.platform || 'facebook');

    const result = await db.raw('ContentAsset').insert({
      title: topic,
      type: 'social_post',
      status: 'draft',
      channel: platform,
      audience: 'Latimore Life & Legacy audience',
      campaign: String(input.content_pillar || 'education'),
      prompt: topic,
      bodyText: String(draft.body || ''),
      metadata: {
        hashtags: draft.hashtags ?? [],
        compliance,
        workflow_run_id: input.context.run_id ?? null,
        generated_by: 'agent_harness',
      },
      createdBy: 'Latimore OS',
    });
    if (result.error) throw new Error(`ContentAsset create failed: ${JSON.stringify(result.error)}`);
    actions.push('canonical_content_asset_created');
  }
}

function getNextStatus(current: string): string {
  const transitions: Record<string, string> = {
    new: 'contacted',
    attempted_contact: 'contacted',
    contacted: 'qualified',
    qualified: 'booked',
    booked: 'in_consult',
    in_consult: 'closed_won',
    nurture: 'contacted',
  };
  return transitions[current] || current;
}
