/**
 * CRM Worker
 * Updates contact records, creates tasks, and manages pipeline state
 */

import { BaseWorker } from '../types';
import type { WorkerInput, WorkerOutput, WorkerEnv } from '../types';
import { createDBClient } from '../lib/supabase';

export class CRMWorker extends BaseWorker {
  name = 'CRMWorker';
  description = 'Updates CRM records: contacts, tasks, pipeline status';

  async execute(input: WorkerInput, env: WorkerEnv): Promise<WorkerOutput> {
    const db = createDBClient(env);
    const action = input.action as string || 'update_contact';
    const contactId = input.contact_id as string || input.context.contact_id as string;

    this.log(`CRM action: ${action} for contact: ${contactId}`);

    const actionsTaken: string[] = [];

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

        default:
          return { success: false, error: `Unknown CRM action: ${action}` };
      }

      return {
        success: true,
        data: { action, contact_id: contactId, actions_taken: actionsTaken },
        actions_taken: actionsTaken,
      };

    } catch (err) {
      this.error(`CRM action failed: ${action}`, err);
      return { success: false, error: String(err) };
    }
  }

  // ── UPDATE CONTACT ─────────────────────────────────────────────────────────

  private async updateContact(
    db: ReturnType<typeof createDBClient>,
    contactId: string,
    input: WorkerInput,
    actions: string[]
  ): Promise<void> {
    if (!contactId) return;

    const updates: Record<string, unknown> = {};

    if (input.lead_status) updates.lead_status = input.lead_status;
    if (input.next_follow_up_at) updates.next_follow_up_at = input.next_follow_up_at;
    if (input.last_contacted_at) updates.last_contacted_at = input.last_contacted_at;
    if (input.notes) updates.notes = input.notes;
    if (input.assigned_agent_id) updates.assigned_agent_id = input.assigned_agent_id;

    if (Object.keys(updates).length > 0) {
      await db.contacts.update(contactId, updates);
      actions.push('contact_updated');
      this.log(`Updated contact ${contactId}: ${Object.keys(updates).join(', ')}`);
    }
  }

  // ── CREATE TASK ────────────────────────────────────────────────────────────

  private async createTask(
    db: ReturnType<typeof createDBClient>,
    contactId: string,
    input: WorkerInput,
    actions: string[]
  ): Promise<void> {
    const dueHours = (input.due_hours as number) || 24;
    const dueAt = new Date(Date.now() + dueHours * 3600000).toISOString();

    await db.tasks.create({
      contact_id: contactId || null,
      title: input.task_title as string || 'Follow up with contact',
      description: input.task_description as string || null,
      task_type: input.task_type as string || 'follow_up',
      status: 'pending',
      priority: input.priority as string || 'medium',
      due_at: dueAt,
      is_automated: true,
      workflow_run_id: input.context.run_id as string || null,
    });

    actions.push('task_created');
    this.log(`Created task: ${input.task_title} (due in ${dueHours}h)`);
  }

  // ── ADVANCE PIPELINE ───────────────────────────────────────────────────────

  private async advancePipeline(
    db: ReturnType<typeof createDBClient>,
    contactId: string,
    input: WorkerInput,
    actions: string[]
  ): Promise<void> {
    if (!contactId) return;

    const contact = await db.contacts.findById(contactId);
    if (!contact) return;

    const currentStatus = contact.lead_status as string;
    const nextStatus = input.next_status as string || getNextStatus(currentStatus);

    if (nextStatus && nextStatus !== currentStatus) {
      await db.contacts.update(contactId, {
        lead_status: nextStatus,
        last_contacted_at: new Date().toISOString(),
      });
      actions.push(`pipeline_advanced:${currentStatus}→${nextStatus}`);
      this.log(`Pipeline advanced: ${currentStatus} → ${nextStatus}`);
    }
  }

  // ── MARK NO SHOW ───────────────────────────────────────────────────────────

  private async markNoShow(
    db: ReturnType<typeof createDBClient>,
    contactId: string,
    input: WorkerInput,
    actions: string[]
  ): Promise<void> {
    const appointmentId = input.appointment_id as string;

    if (appointmentId) {
      await db.raw('appointments')
        .update({ status: 'no_show' })
        .eq('id', appointmentId)
        .execute();
      actions.push('appointment_marked_no_show');
    }

    if (contactId) {
      await db.contacts.update(contactId, {
        lead_status: 'contacted',
        next_follow_up_at: new Date(Date.now() + 2 * 3600000).toISOString(), // 2h recovery
      });
      actions.push('contact_status_reset');
    }

    // Create recovery task
    await db.tasks.create({
      contact_id: contactId || null,
      title: `No-show recovery: ${input.contact_name as string || 'Contact'}`,
      task_type: 'follow_up',
      status: 'pending',
      priority: 'high',
      due_at: new Date(Date.now() + 2 * 3600000).toISOString(),
      is_automated: true,
    });
    actions.push('recovery_task_created');
  }

  // ── CLOSE WON ──────────────────────────────────────────────────────────────

  private async closeWon(
    db: ReturnType<typeof createDBClient>,
    contactId: string,
    input: WorkerInput,
    actions: string[]
  ): Promise<void> {
    if (!contactId) return;

    await db.contacts.update(contactId, {
      lead_status: 'closed_won',
      last_contacted_at: new Date().toISOString(),
      next_follow_up_at: new Date(Date.now() + 7 * 24 * 3600000).toISOString(), // 7-day referral ask
    });
    actions.push('contact_closed_won');

    // Create referral ask task
    await db.tasks.create({
      contact_id: contactId,
      title: `Referral ask: ${input.contact_name as string || 'Client'}`,
      task_type: 'follow_up',
      status: 'pending',
      priority: 'medium',
      due_at: new Date(Date.now() + 7 * 24 * 3600000).toISOString(),
      notes: 'Send referral request — 7 days post-close',
      is_automated: true,
    });
    actions.push('referral_task_created');
  }

  // ── CLOSE LOST ─────────────────────────────────────────────────────────────

  private async closeLost(
    db: ReturnType<typeof createDBClient>,
    contactId: string,
    input: WorkerInput,
    actions: string[]
  ): Promise<void> {
    if (!contactId) return;

    await db.contacts.update(contactId, {
      lead_status: 'closed_lost',
      next_follow_up_at: new Date(Date.now() + 90 * 24 * 3600000).toISOString(), // 90-day nurture
      notes: input.loss_reason as string || 'Closed lost',
    });
    actions.push('contact_closed_lost');

    // Add to nurture sequence
    await db.tasks.create({
      contact_id: contactId,
      title: `90-day nurture check-in: ${input.contact_name as string || 'Contact'}`,
      task_type: 'follow_up',
      status: 'pending',
      priority: 'low',
      due_at: new Date(Date.now() + 90 * 24 * 3600000).toISOString(),
      notes: 'Nurture follow-up — circumstances may have changed',
      is_automated: true,
    });
    actions.push('nurture_task_created');
  }

  // ── TAG CONTACT ────────────────────────────────────────────────────────────

  private async tagContact(
    db: ReturnType<typeof createDBClient>,
    contactId: string,
    input: WorkerInput,
    actions: string[]
  ): Promise<void> {
    if (!contactId) return;

    const newTags = input.tags as string[] || [];
    if (newTags.length === 0) return;

    const contact = await db.contacts.findById(contactId);
    if (!contact) return;

    const existingTags = contact.tags as string[] || [];
    const mergedTags = [...new Set([...existingTags, ...newTags])];

    await db.contacts.update(contactId, { tags: mergedTags });
    actions.push(`tags_added:${newTags.join(',')}`);
  }
}

// ── PIPELINE STATE MACHINE ────────────────────────────────────────────────────

function getNextStatus(current: string): string {
  const transitions: Record<string, string> = {
    'new': 'contacted',
    'contacted': 'assessment_scheduled',
    'assessment_scheduled': 'proposal_sent',
    'proposal_sent': 'closed_won',
    'nurture': 'contacted',
  };
  return transitions[current] || current;
}