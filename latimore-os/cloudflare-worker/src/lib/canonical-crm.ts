import type { SupabaseClient } from './supabase';

export interface CanonicalLeadInput {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
  landingPage?: string | null;
  interest?: string | null;
  coverageAmount?: number | null;
  message?: string | null;
  externalId?: string | null;
  raw?: Record<string, unknown> | null;
}

function row<T extends Record<string, unknown>>(data: unknown): T | null {
  if (Array.isArray(data)) return (data[0] as T | undefined) ?? null;
  return data && typeof data === 'object' ? data as T : null;
}

export function mapProductInterest(value?: string | null): string {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return 'General';
  if (normalized.includes('mortgage')) return 'Mortgage_Protection';
  if (normalized.includes('final') || normalized.includes('burial')) return 'Final_Expense';
  if (normalized.includes('term')) return 'Term_Life';
  if (normalized.includes('child') || normalized.includes('juvenile')) return 'Child_Whole_Life';
  if (normalized.includes('whole')) return 'Whole_Life';
  if (normalized.includes('accident')) return 'Accident';
  if (normalized.includes('critical')) return 'Critical_Illness';
  if (normalized.includes('iul') || normalized.includes('indexed universal')) return 'IUL';
  if (normalized.includes('annuity')) return 'Annuity';
  if (normalized.includes('retire')) return 'Retirement';
  if (normalized.includes('business')) return 'Business';
  return 'General';
}

export async function findOrCreateCanonicalContact(
  db: SupabaseClient,
  input: CanonicalLeadInput,
): Promise<string> {
  let existing: { id: string } | null = null;

  if (input.email) {
    const result = await db.from('Contact').select('id').eq('email', input.email).single();
    if (result.error) throw new Error(`Contact email lookup failed: ${result.error.message}`);
    existing = row<{ id: string }>(result.data);
  }

  if (!existing && input.phone) {
    const result = await db.from('Contact').select('id').eq('phone', input.phone).single();
    if (result.error) throw new Error(`Contact phone lookup failed: ${result.error.message}`);
    existing = row<{ id: string }>(result.data);
  }

  const now = new Date().toISOString();
  const nextFollowUpAt = new Date(Date.now() + 24 * 3600000).toISOString();

  if (existing) {
    const update = await db.from('Contact').update({
      lastActivityAt: now,
      nextFollowUpAt,
      ...(input.source ? { primarySource: input.source } : {}),
      ...(input.campaign ? { primaryCampaign: input.campaign } : {}),
      ...(input.message ? { notesSummary: input.message } : {}),
    }).eq('id', existing.id).execute();
    if (update.error) throw new Error(`Contact update failed: ${update.error.message}`);
    return existing.id;
  }

  const result = await db.from('Contact').insert({
    firstName: input.firstName || null,
    lastName: input.lastName || null,
    fullName: [input.firstName, input.lastName].filter(Boolean).join(' ') || null,
    email: input.email || null,
    phone: input.phone || null,
    primarySource: input.source || null,
    primaryMedium: input.medium || null,
    primaryCampaign: input.campaign || null,
    status: 'NEW',
    lastActivityAt: now,
    nextFollowUpAt,
    notesSummary: input.message || null,
  });
  if (result.error) throw new Error(`Contact create failed: ${result.error.message}`);
  const created = row<{ id: string }>(result.data);
  if (!created?.id) throw new Error('Contact create returned no id');
  return created.id;
}

export async function hasRecentCanonicalInquiry(
  db: SupabaseClient,
  contactId: string,
  withinHours = 24,
): Promise<boolean> {
  const result = await db.from('Inquiry')
    .select('id,createdAt')
    .eq('contactId', contactId)
    .order('createdAt', { ascending: false })
    .limit(1)
    .execute();
  if (result.error) throw new Error(`Inquiry duplicate check failed: ${result.error.message}`);
  const existing = row<{ id: string; createdAt: string }>(result.data);
  if (!existing?.createdAt) return false;
  return (Date.now() - new Date(existing.createdAt).getTime()) < withinHours * 3600000;
}

export async function createCanonicalInquiry(
  db: SupabaseClient,
  contactId: string,
  input: CanonicalLeadInput,
): Promise<string> {
  const noteParts = [
    input.message || '',
    input.coverageAmount ? `Requested coverage: $${input.coverageAmount.toLocaleString()}` : '',
    input.externalId ? `External submission: ${input.externalId}` : '',
  ].filter(Boolean);

  const result = await db.from('Inquiry').insert({
    contactId,
    stage: 'New',
    productInterest: mapProductInterest(input.interest),
    source: input.source || null,
    medium: input.medium || null,
    campaign: input.campaign || null,
    landingPage: input.landingPage || null,
    status: 'NEW',
    notes: noteParts.join('\n') || null,
  });
  if (result.error) throw new Error(`Inquiry create failed: ${result.error.message}`);
  const inquiry = row<{ id: string }>(result.data);
  if (!inquiry?.id) throw new Error('Inquiry create returned no id');

  const event = await db.from('SystemEvent').insert({
    type: 'lead.created',
    contactId,
    inquiryId: inquiry.id,
    source: input.source || 'edge_intake',
    medium: input.medium || null,
    campaign: input.campaign || null,
    payload: {
      interest: input.interest || null,
      coverageAmount: input.coverageAmount || null,
      externalId: input.externalId || null,
      raw: input.raw || null,
    },
    metadata: { landingPage: input.landingPage || null },
    occurredAt: new Date().toISOString(),
  });
  if (event.error) console.error('[CanonicalCRM] Failed to write lead.created event:', event.error);

  return inquiry.id;
}

export async function markCanonicalBooking(
  db: SupabaseClient,
  contactId: string,
  scheduledFor?: string | null,
): Promise<string | null> {
  const contactUpdate = await db.from('Contact').update({
    status: 'BOOKED',
    nextFollowUpAt: scheduledFor || null,
    lastActivityAt: new Date().toISOString(),
  }).eq('id', contactId).execute();
  if (contactUpdate.error) throw new Error(`Booked contact update failed: ${contactUpdate.error.message}`);

  const latest = await db.from('Inquiry')
    .select('id')
    .eq('contactId', contactId)
    .order('createdAt', { ascending: false })
    .limit(1)
    .execute();
  if (latest.error) throw new Error(`Inquiry lookup for booking failed: ${latest.error.message}`);
  const inquiry = row<{ id: string }>(latest.data);
  if (!inquiry?.id) return null;

  const update = await db.from('Inquiry').update({ stage: 'Booked', status: 'BOOKED' }).eq('id', inquiry.id).execute();
  if (update.error) throw new Error(`Inquiry booking update failed: ${update.error.message}`);
  return inquiry.id;
}
