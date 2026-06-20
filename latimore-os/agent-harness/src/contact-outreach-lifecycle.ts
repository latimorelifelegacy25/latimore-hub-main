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
}

export function buildContactOutreachFallback(
  event: ContactOutreachTriggerEvent,
  firstName = 'there',
): StagedContactOutreachDraft {
  return {
    status: 'STAGED_FOR_REVIEW',
    triggerType: event.triggerType,
    subject: 'Checking in from Latimore Life & Legacy',
    body: `Hi ${firstName},\n\nI am checking in. Reply here whenever you are ready.\n\nBest,\nJackson`,
  };
}
