import type { WorkerEnv, WorkerOutput, StepDefinition } from './types';
import { createDBClient } from './lib/supabase';
import { DraftWorker } from './workers/draft-worker';
import { ComplianceReviewer } from './workers/compliance-reviewer';

export type ContactOutreachTriggerType = 'STALE_STAGE' | 'MISSED_BOOKING' | 'SCORE_SPIKE';

export interface ContactOutreachTriggerEvent {
  eventId?: string;
  contactId: string;
  triggerType: ContactOutreachTriggerType;
  metadata?: Record<string, unknown>;
}

export interface StagedContactOutreachDraft {
  status: 'STAGED_FOR_REVIEW';
  triggerType: ContactOutreachTriggerType;
  subject: string;
  body: string;
  reviewPassed: boolean;
}

export async function orchestrateContactOutreachLifecycle(
  event: ContactOutreachTriggerEvent,
  env: WorkerEnv,
): Promise<StagedContactOutreachDraft> {
  const db = createDBClient(env);
  const contact = await db.contacts.findById(event.contactId);

  if (!contact) {
    throw new Error(`Contact record matching ID ${event.contactId} was not found.`);
  }

  return buildReviewedContactOutreachDraft(event, env, contact);
}

export async function buildReviewedContactOutreachDraft(
  event: ContactOutreachTriggerEvent,
  env: WorkerEnv,
  contact: Record<string, unknown>,
): Promise<StagedContactOutreachDraft> {
  const firstName = getFirstName(contact);
  const draftWorker = new DraftWorker();
  const draftResult = await draftWorker.execute({
    context: buildContext(event),
    step: buildStep('draft_contact_message', 'Draft contact message', 'DraftWorker'),
    draft_type: event.triggerType === 'MISSED_BOOKING' ? 'no_show_recovery' : 'follow_up_email',
    contact,
    first_name: firstName,
    contact_summary: buildSummary(contact, event),
  }, env);

  const draft = normalizeDraft(draftResult, event, firstName);
  const reviewer = new ComplianceReviewer();
  const review = await reviewer.execute({
    context: buildContext(event),
    step: buildStep('review_contact_message', 'Review contact message', 'ComplianceReviewer'),
    content: `${draft.subject}\n\n${draft.body}`,
    use_ai_review: true,
  }, env);

  if (review.success && review.data?.passed !== false) {
    return { ...draft, reviewPassed: true };
  }

  return buildContactOutreachFallback(event, firstName);
}

export function buildContactOutreachFallback(
  event: ContactOutreachTriggerEvent,
  firstName = 'there',
): StagedContactOutreachDraft {
  return {
    status: 'STAGED_FOR_REVIEW',
    triggerType: event.triggerType,
    subject: 'Checking in from Latimore Life & Legacy',
    body: `Hi ${cleanName(firstName)},\n\nI am checking in. Reply here whenever you are ready.\n\nBest,\nJackson`,
    reviewPassed: true,
  };
}

function buildContext(event: ContactOutreachTriggerEvent) {
  return {
    run_id: event.eventId ?? `contact-outreach-${event.contactId}-${Date.now()}`,
    workflow_name: 'contact_outreach_lifecycle',
    trigger_type: event.triggerType,
    contact_id: event.contactId,
  };
}

function buildStep(id: string, name: string, worker: string): StepDefinition {
  return { id, name, worker };
}

function normalizeDraft(
  output: WorkerOutput,
  event: ContactOutreachTriggerEvent,
  firstName: string,
): StagedContactOutreachDraft {
  const fallback = buildContactOutreachFallback(event, firstName);
  const data = output.success ? output.data ?? {} : {};
  return {
    status: 'STAGED_FOR_REVIEW',
    triggerType: event.triggerType,
    subject: String(data.subject ?? fallback.subject),
    body: String(data.body ?? fallback.body),
    reviewPassed: false,
  };
}

function buildSummary(contact: Record<string, unknown>, event: ContactOutreachTriggerEvent): string {
  return [
    `Name: ${getFirstName(contact)}`,
    `Trigger: ${event.triggerType}`,
    `Lead status: ${String(contact.lead_status ?? contact.status ?? 'unknown')}`,
  ].join('\n');
}

function getFirstName(contact: Record<string, unknown>): string {
  const raw = contact.first_name ?? contact.firstName ?? contact.full_name ?? contact.fullName ?? 'there';
  return String(raw).trim().split(/\s+/)[0] || 'there';
}

function cleanName(value: string): string {
  return value.replaceAll('<', '').replaceAll('>', '').replaceAll('&', 'and');
}
