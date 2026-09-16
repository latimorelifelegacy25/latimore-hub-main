/**
 * Canonical Supabase adapter for the Latimore OS Agent Harness.
 *
 * IMPORTANT: the production data core is the Prisma-managed schema used by
 * latimore-hub-main ("Contact", "Inquiry", "Task", "Appointment", etc.).
 * The historical lowercase CRM tables are not used by this adapter.
 */

import type { WorkerEnv } from '../types';

export interface DBClient {
  contacts: {
    findById: (id: string) => Promise<Record<string, unknown> | null>;
    findByEmail: (email: string) => Promise<Record<string, unknown> | null>;
    update: (id: string, data: Record<string, unknown>) => Promise<void>;
    create: (data: Record<string, unknown>) => Promise<Record<string, unknown>>;
  };
  leads: {
    findById: (id: string) => Promise<Record<string, unknown> | null>;
    update: (id: string, data: Record<string, unknown>) => Promise<void>;
  };
  tasks: {
    create: (data: Record<string, unknown>) => Promise<Record<string, unknown>>;
    update: (id: string, data: Record<string, unknown>) => Promise<void>;
  };
  communications: {
    create: (data: Record<string, unknown>) => Promise<Record<string, unknown>>;
  };
  workflowRuns: {
    create: (data: Record<string, unknown>) => Promise<Record<string, unknown>>;
    update: (id: string, data: Record<string, unknown>) => Promise<void>;
  };
  raw: (table: string) => RawQueryBuilder;
}

interface RawQueryBuilder {
  select: (cols?: string) => RawQueryBuilder;
  insert: (data: Record<string, unknown> | Record<string, unknown>[]) => Promise<{ data: unknown; error: unknown }>;
  update: (data: Record<string, unknown>) => RawQueryBuilder;
  upsert: (data: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
  eq: (col: string, val: unknown) => RawQueryBuilder;
  single: () => Promise<{ data: unknown; error: unknown }>;
  limit: (n: number) => RawQueryBuilder;
  order: (col: string, opts?: { ascending?: boolean }) => RawQueryBuilder;
  execute: () => Promise<{ data: unknown; error: unknown }>;
}

type QueryResult = { data: unknown; error: unknown };

const LEGACY_TO_CANONICAL_STATUS: Record<string, string> = {
  new: 'NEW',
  attempted_contact: 'ATTEMPTED_CONTACT',
  contacted: 'CONTACTED',
  qualified: 'QUALIFIED',
  assessment_scheduled: 'BOOKED',
  booked: 'BOOKED',
  proposal_sent: 'IN_CONSULT',
  in_consult: 'IN_CONSULT',
  closed_won: 'CLOSED_WON',
  sold: 'CLOSED_WON',
  closed_lost: 'CLOSED_LOST',
  lost: 'CLOSED_LOST',
  nurture: 'NURTURE',
  on_hold: 'ON_HOLD',
  dormant: 'DORMANT',
};

function canonicalStatus(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  return LEGACY_TO_CANONICAL_STATUS[value.toLowerCase()] ?? value.toUpperCase();
}

function normalizeContact(row: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!row) return null;
  return {
    ...row,
    first_name: row.firstName ?? null,
    last_name: row.lastName ?? null,
    full_name: row.fullName ?? null,
    lead_source: row.primarySource ?? null,
    lead_status: typeof row.status === 'string' ? row.status.toLowerCase() : row.status,
    next_follow_up_at: row.nextFollowUpAt ?? null,
    last_contacted_at: row.lastActivityAt ?? null,
    notes: row.notesSummary ?? null,
  };
}

function normalizeInquiry(row: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!row) return null;
  return {
    ...row,
    contact_id: row.contactId ?? null,
    created_at: row.createdAt ?? null,
    updated_at: row.updatedAt ?? null,
    lead_status: typeof row.status === 'string' ? row.status.toLowerCase() : row.status,
    lead_score: row.leadScore ?? 0,
    interest: row.productInterest ?? 'General',
  };
}

function contactWrite(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const map: Record<string, string> = {
    first_name: 'firstName',
    last_name: 'lastName',
    full_name: 'fullName',
    lead_source: 'primarySource',
    next_follow_up_at: 'nextFollowUpAt',
    last_contacted_at: 'lastActivityAt',
    notes: 'notesSummary',
  };

  for (const [key, value] of Object.entries(input)) {
    if (key === 'lead_status') out.status = canonicalStatus(value);
    else if (key in map) out[map[key]] = value;
    else if (['email', 'phone', 'county', 'leadScore', 'lastActivityAt', 'nextFollowUpAt', 'notesSummary', 'status'].includes(key)) {
      out[key] = key === 'status' ? canonicalStatus(value) : value;
    }
  }

  if (!out.fullName && (out.firstName || out.lastName)) {
    out.fullName = [out.firstName, out.lastName].filter(Boolean).join(' ');
  }
  return out;
}

function inquiryWrite(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const map: Record<string, string> = {
    contact_id: 'contactId',
    lead_session_id: 'leadSessionId',
    lead_score: 'leadScore',
    product_interest: 'productInterest',
  };
  for (const [key, value] of Object.entries(input)) {
    if (key === 'lead_status') out.status = canonicalStatus(value);
    else if (key in map) out[map[key]] = value;
    else if (['stage', 'source', 'medium', 'campaign', 'county', 'notes', 'status', 'landingPage'].includes(key)) {
      out[key] = key === 'status' ? canonicalStatus(value) : value;
    }
  }
  return out;
}

function taskWrite(input: Record<string, unknown>): Record<string, unknown> {
  const metadata = {
    task_type: input.task_type ?? null,
    priority: input.priority ?? null,
    is_automated: input.is_automated ?? null,
    workflow_run_id: input.workflow_run_id ?? null,
  };
  const notes = typeof input.notes === 'string' ? input.notes : '';
  const description = [
    typeof input.description === 'string' ? input.description : '',
    notes,
    `Workflow metadata: ${JSON.stringify(metadata)}`,
  ].filter(Boolean).join('\n\n');

  return {
    contactId: input.contact_id ?? input.contactId ?? null,
    inquiryId: input.inquiry_id ?? input.inquiryId ?? null,
    title: input.title ?? 'Follow up with contact',
    description: description || null,
    status: String(input.status ?? 'Open').toLowerCase() === 'completed' ? 'Completed' : 'Open',
    dueAt: input.due_at ?? input.dueAt ?? null,
  };
}

export function createDBClient(env: WorkerEnv): DBClient {
  const baseUrl = env.SUPABASE_URL;
  const apiKey = env.SUPABASE_SERVICE_ROLE_KEY;

  const headers = {
    'Content-Type': 'application/json',
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    Prefer: 'return=representation',
  };

  async function query(
    table: string,
    method: string,
    body?: unknown,
    params?: Record<string, string>,
  ): Promise<QueryResult> {
    let url = `${baseUrl}/rest/v1/${encodeURIComponent(table)}`;
    if (params && Object.keys(params).length > 0) url += `?${new URLSearchParams(params).toString()}`;

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const text = await res.text();
      const parsed = text ? JSON.parse(text) : null;
      if (!res.ok) return { data: null, error: parsed ?? `${res.status} ${res.statusText}` };
      return { data: parsed, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  function assertNoError(result: QueryResult, action: string): QueryResult {
    if (result.error) throw new Error(`${action}: ${JSON.stringify(result.error)}`);
    return result;
  }

  function buildRaw(table: string, state: { method: string; params: Record<string, string>; body?: unknown; isSingle?: boolean }): RawQueryBuilder {
    const builder: RawQueryBuilder = {
      select(cols = '*') {
        return buildRaw(table, { ...state, method: 'GET', params: { ...state.params, select: cols } });
      },
      async insert(data) {
        return query(table, 'POST', data);
      },
      update(data) {
        return buildRaw(table, { ...state, method: 'PATCH', body: data });
      },
      async upsert(data) {
        return query(table, 'POST', data, { on_conflict: 'id' });
      },
      eq(col, val) {
        return buildRaw(table, { ...state, params: { ...state.params, [col]: `eq.${val}` } });
      },
      single() {
        return buildRaw(table, { ...state, isSingle: true, params: { ...state.params, limit: '1' } }).execute();
      },
      limit(n) {
        return buildRaw(table, { ...state, params: { ...state.params, limit: String(n) } });
      },
      order(col, opts) {
        return buildRaw(table, { ...state, params: { ...state.params, order: `${col}.${opts?.ascending === false ? 'desc' : 'asc'}` } });
      },
      async execute() {
        const result = await query(table, state.method, state.body, state.params);
        if (state.isSingle && Array.isArray(result.data)) return { ...result, data: result.data[0] ?? null };
        return result;
      },
    };
    return builder;
  }

  return {
    contacts: {
      async findById(id) {
        const result = assertNoError(await query('Contact', 'GET', undefined, { id: `eq.${id}`, limit: '1' }), 'Contact lookup failed');
        const row = Array.isArray(result.data) ? result.data[0] : result.data;
        return normalizeContact((row ?? null) as Record<string, unknown> | null);
      },
      async findByEmail(email) {
        const result = assertNoError(await query('Contact', 'GET', undefined, { email: `eq.${email}`, limit: '1' }), 'Contact email lookup failed');
        const row = Array.isArray(result.data) ? result.data[0] : result.data;
        return normalizeContact((row ?? null) as Record<string, unknown> | null);
      },
      async update(id, data) {
        assertNoError(await query('Contact', 'PATCH', contactWrite(data), { id: `eq.${id}` }), 'Contact update failed');
      },
      async create(data) {
        const result = assertNoError(await query('Contact', 'POST', contactWrite(data)), 'Contact create failed');
        const row = Array.isArray(result.data) ? result.data[0] : result.data;
        return normalizeContact((row ?? null) as Record<string, unknown> | null) ?? {};
      },
    },
    leads: {
      async findById(id) {
        const result = assertNoError(await query('Inquiry', 'GET', undefined, { id: `eq.${id}`, limit: '1' }), 'Inquiry lookup failed');
        const row = Array.isArray(result.data) ? result.data[0] : result.data;
        return normalizeInquiry((row ?? null) as Record<string, unknown> | null);
      },
      async update(id, data) {
        assertNoError(await query('Inquiry', 'PATCH', inquiryWrite(data), { id: `eq.${id}` }), 'Inquiry update failed');
      },
    },
    tasks: {
      async create(data) {
        const result = assertNoError(await query('Task', 'POST', taskWrite(data)), 'Task create failed');
        return (Array.isArray(result.data) ? result.data[0] : result.data) as Record<string, unknown>;
      },
      async update(id, data) {
        assertNoError(await query('Task', 'PATCH', taskWrite(data), { id: `eq.${id}` }), 'Task update failed');
      },
    },
    communications: {
      async create(data) {
        const channel = String(data.channel ?? 'message');
        const result = assertNoError(await query('SystemEvent', 'POST', {
          type: `workflow.communication.${channel}`,
          contactId: data.contact_id ?? null,
          source: 'agent_harness',
          payload: data,
          occurredAt: data.sent_at ?? new Date().toISOString(),
        }), 'Communication event create failed');
        return (Array.isArray(result.data) ? result.data[0] : result.data) as Record<string, unknown>;
      },
    },
    workflowRuns: {
      async create(data) {
        const result = assertNoError(await query('workflow_runs', 'POST', data), 'Workflow run create failed');
        return (Array.isArray(result.data) ? result.data[0] : result.data) as Record<string, unknown>;
      },
      async update(id, data) {
        assertNoError(await query('workflow_runs', 'PATCH', { ...data, updated_at: new Date().toISOString() }, { id: `eq.${id}` }), 'Workflow run update failed');
      },
    },
    raw: (table: string) => buildRaw(table, { method: 'GET', params: {} }),
  };
}
