/**
 * Research Worker
 * Fetches and summarizes contact/lead data from CRM for use in other workers
 */

import { BaseWorker } from '../types';
import type { WorkerInput, WorkerOutput, WorkerEnv } from '../types';
import { createDBClient } from '../lib/supabase';

export class ResearchWorker extends BaseWorker {
  name = 'ResearchWorker';
  description = 'Fetches contact profile, history, and context from CRM';

  async execute(input: WorkerInput, env: WorkerEnv): Promise<WorkerOutput> {
    const db = createDBClient(env);
    const contactId = input.contact_id as string || input.context.contact_id as string;
    const leadId = input.lead_id as string || input.context.lead_id as string;

    this.log(`Researching contact: ${contactId || 'from lead: ' + leadId}`);

    try {
      let contact: Record<string, unknown> | null = null;

      // Fetch contact by ID
      if (contactId) {
        contact = await db.contacts.findById(contactId);
      }

      // Fetch contact from lead
      if (!contact && leadId) {
        const lead = await db.leads.findById(leadId);
        if (lead?.contact_id) {
          contact = await db.contacts.findById(lead.contact_id as string);
        }
        if (!contact && lead) {
          // Build minimal contact from lead data
          contact = {
            first_name: lead.first_name,
            last_name: lead.last_name,
            email: lead.email,
            phone: lead.phone,
            lead_source: lead.source,
            lead_status: 'new',
            interest: lead.interest,
          };
        }
      }

      if (!contact) {
        return {
          success: false,
          error: `Contact not found (contact_id: ${contactId}, lead_id: ${leadId})`,
        };
      }

      // Fetch recent communications
      let recentComms: unknown[] = [];
      if (contactId) {
        const { data } = await db.raw('communications')
          .select('channel, direction, subject, sent_at, status')
          .eq('contact_id', contactId)
          .order('sent_at', { ascending: false })
          .limit(5)
          .execute();
        recentComms = Array.isArray(data) ? data : [];
      }

      // Fetch recent appointments
      let recentAppts: unknown[] = [];
      if (contactId) {
        const { data } = await db.raw('appointments')
          .select('appointment_type, status, scheduled_at, outcome')
          .eq('contact_id', contactId)
          .order('scheduled_at', { ascending: false })
          .limit(3)
          .execute();
        recentAppts = Array.isArray(data) ? data : [];
      }

      // Fetch existing policies
      let policies: unknown[] = [];
      if (contactId) {
        const { data } = await db.raw('policies')
          .select('carrier, policy_type, status, face_amount, premium_monthly')
          .eq('contact_id', contactId)
          .execute();
        policies = Array.isArray(data) ? data : [];
      }

      // Build contact profile summary
      const profile = {
        contact,
        recent_communications: recentComms,
        recent_appointments: recentAppts,
        existing_policies: policies,
        contact_summary: buildContactSummary(contact, recentComms, recentAppts, policies),
      };

      this.log(`Research complete for ${contact.first_name} ${contact.last_name}`);

      return {
        success: true,
        data: profile,
        actions_taken: ['fetched_contact', 'fetched_communications', 'fetched_appointments', 'fetched_policies'],
      };

    } catch (err) {
      this.error('Research failed', err);
      return { success: false, error: String(err) };
    }
  }
}

function buildContactSummary(
  contact: Record<string, unknown>,
  comms: unknown[],
  appts: unknown[],
  policies: unknown[]
): string {
  const parts: string[] = [];

  parts.push(`Name: ${contact.first_name} ${contact.last_name}`);
  if (contact.email) parts.push(`Email: ${contact.email}`);
  if (contact.phone) parts.push(`Phone: ${contact.phone}`);
  if (contact.lead_status) parts.push(`Status: ${contact.lead_status}`);
  if (contact.lead_source) parts.push(`Source: ${contact.lead_source}`);
  if (contact.annual_income) parts.push(`Income: $${Number(contact.annual_income).toLocaleString()}/yr`);
  if (contact.has_life_insurance) parts.push('Has existing life insurance: Yes');
  if (contact.has_annuity) parts.push('Has existing annuity: Yes');
  if (contact.smoker) parts.push('Smoker: Yes');
  if (contact.health_rating) parts.push(`Health rating: ${contact.health_rating}`);
  if (contact.notes) parts.push(`Notes: ${contact.notes}`);

  if (comms.length > 0) {
    parts.push(`Recent communications: ${comms.length} (last: ${(comms[0] as Record<string, unknown>).channel})`);
  } else {
    parts.push('No previous communications on record');
  }

  if (appts.length > 0) {
    const lastAppt = appts[0] as Record<string, unknown>;
    parts.push(`Last appointment: ${lastAppt.appointment_type} (${lastAppt.status})`);
  }

  if (policies.length > 0) {
    parts.push(`Existing policies: ${policies.length} (${(policies as Array<Record<string, unknown>>).map(p => p.carrier).join(', ')})`);
  }

  return parts.join('\n');
}