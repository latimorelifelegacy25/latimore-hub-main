/**
 * Research Worker
 * Reads the canonical Prisma-managed Latimore CRM data core.
 */

import { BaseWorker } from '../types';
import type { WorkerInput, WorkerOutput, WorkerEnv } from '../types';
import { createDBClient } from '../lib/supabase';

function rows(data: unknown): Record<string, unknown>[] {
  return Array.isArray(data) ? data as Record<string, unknown>[] : [];
}

export class ResearchWorker extends BaseWorker {
  name = 'ResearchWorker';
  description = 'Fetches canonical contact, inquiry, communication, and appointment context';

  async execute(input: WorkerInput, env: WorkerEnv): Promise<WorkerOutput> {
    const db = createDBClient(env);
    let contactId = (input.contact_id as string) || (input.context.contact_id as string) || '';
    const leadId = (input.lead_id as string) || (input.context.lead_id as string) || '';

    this.log(`Researching canonical CRM record: ${contactId || `inquiry ${leadId}`}`);

    try {
      let contact: Record<string, unknown> | null = null;
      let inquiry: Record<string, unknown> | null = null;

      if (contactId) contact = await db.contacts.findById(contactId);

      if (leadId) {
        inquiry = await db.leads.findById(leadId);
        if (!contact && inquiry?.contact_id) {
          contactId = String(inquiry.contact_id);
          contact = await db.contacts.findById(contactId);
        }
      }

      if (!contact) {
        return {
          success: false,
          error: `Canonical Contact not found (contact_id: ${contactId || 'none'}, inquiry_id: ${leadId || 'none'})`,
        };
      }

      const [messageResult, eventResult, appointmentResult] = contactId
        ? await Promise.all([
            db.raw('ConversationMessage')
              .select('channel,direction,subject,status,sentAt,deliveredAt,createdAt')
              .eq('contactId', contactId)
              .order('createdAt', { ascending: false })
              .limit(5)
              .execute(),
            db.raw('SystemEvent')
              .select('type,source,occurredAt,payload')
              .eq('contactId', contactId)
              .order('occurredAt', { ascending: false })
              .limit(5)
              .execute(),
            db.raw('Appointment')
              .select('bookingSource,status,scheduledFor,location,createdAt')
              .eq('contactId', contactId)
              .order('createdAt', { ascending: false })
              .limit(3)
              .execute(),
          ])
        : [{ data: [], error: null }, { data: [], error: null }, { data: [], error: null }];

      const conversationMessages = rows(messageResult.data);
      const systemEvents = rows(eventResult.data);
      const recentAppointments = rows(appointmentResult.data);

      const profile = {
        contact,
        inquiry,
        recent_communications: conversationMessages,
        recent_system_events: systemEvents,
        recent_appointments: recentAppointments,
        existing_policies: [],
        policy_data_available: false,
        contact_summary: buildContactSummary(contact, inquiry, conversationMessages, recentAppointments),
      };

      this.log(`Canonical CRM research complete for ${contact.first_name ?? ''} ${contact.last_name ?? ''}`.trim());

      return {
        success: true,
        data: profile,
        actions_taken: [
          'fetched_canonical_contact',
          ...(inquiry ? ['fetched_canonical_inquiry'] : []),
          'fetched_conversation_messages',
          'fetched_system_events',
          'fetched_appointments',
        ],
      };
    } catch (err) {
      this.error('Research failed', err);
      return { success: false, error: String(err) };
    }
  }
}

function buildContactSummary(
  contact: Record<string, unknown>,
  inquiry: Record<string, unknown> | null,
  messages: Record<string, unknown>[],
  appointments: Record<string, unknown>[],
): string {
  const parts: string[] = [];
  const name = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || String(contact.full_name ?? 'Unknown contact');

  parts.push(`Name: ${name}`);
  if (contact.email) parts.push(`Email: ${contact.email}`);
  if (contact.phone) parts.push(`Phone: ${contact.phone}`);
  if (contact.lead_status) parts.push(`Status: ${contact.lead_status}`);
  if (contact.lead_source) parts.push(`Source: ${contact.lead_source}`);
  if (contact.notes) parts.push(`Notes: ${contact.notes}`);

  if (inquiry?.interest) parts.push(`Inquiry interest: ${inquiry.interest}`);
  if (inquiry?.lead_score !== undefined) parts.push(`Inquiry lead score: ${inquiry.lead_score}`);

  if (messages.length > 0) {
    const last = messages[0];
    parts.push(`Recent communications: ${messages.length} (last channel: ${String(last.channel ?? 'unknown')})`);
  } else {
    parts.push('No canonical conversation messages on record');
  }

  if (appointments.length > 0) {
    const last = appointments[0];
    parts.push(`Last appointment: ${String(last.status ?? 'unknown')} (${String(last.scheduledFor ?? last.createdAt ?? 'date unavailable')})`);
  }

  parts.push('Policy inventory is not stored in the current canonical Prisma CRM schema; no policy assumptions were added.');
  return parts.join('\n');
}
