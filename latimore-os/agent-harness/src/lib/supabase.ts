/**
 * Supabase client for Agent Harness (Node.js / Next.js environment)
 * Uses @supabase/supabase-js
 */

import type { WorkerEnv } from '../types';

// Type-safe wrapper around Supabase operations
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
  kpiSnapshots: {
    upsert: (data: Record<string, unknown>) => Promise<void>;
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

export function createDBClient(env: WorkerEnv): DBClient {
  const baseUrl = env.SUPABASE_URL;
  const apiKey = env.SUPABASE_SERVICE_ROLE_KEY;

  const headers = {
    'Content-Type': 'application/json',
    'apikey': apiKey,
    'Authorization': `Bearer ${apiKey}`,
    'Prefer': 'return=representation',
  };

  async function query(
    table: string,
    method: string,
    body?: unknown,
    params?: Record<string, string>
  ): Promise<{ data: unknown; error: unknown }> {
    let url = `${baseUrl}/rest/v1/${table}`;
    if (params && Object.keys(params).length > 0) {
      url += `?${new URLSearchParams(params).toString()}`;
    }

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const text = await res.text();
      const parsed = text ? JSON.parse(text) : null;

      if (!res.ok) {
        return { data: null, error: parsed };
      }
      return { data: parsed, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  function buildRaw(table: string, state: {
    method: string;
    params: Record<string, string>;
    body?: unknown;
    isSingle?: boolean;
  }): RawQueryBuilder {
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
        if (state.isSingle && Array.isArray(result.data)) {
          return { ...result, data: result.data[0] ?? null };
        }
        return result;
      },
    };
    return builder;
  }

  return {
    contacts: {
      async findById(id) {
        const { data } = await buildRaw('contacts', { method: 'GET', params: { id: `eq.${id}`, limit: '1' } }).execute();
        return Array.isArray(data) ? data[0] as Record<string, unknown> : data as Record<string, unknown> | null;
      },
      async findByEmail(email) {
        const { data } = await buildRaw('contacts', { method: 'GET', params: { email: `eq.${email}`, limit: '1' } }).execute();
        return Array.isArray(data) ? data[0] as Record<string, unknown> : data as Record<string, unknown> | null;
      },
      async update(id, data) {
        await query('contacts', 'PATCH', data, { id: `eq.${id}` });
      },
      async create(data) {
        const { data: result } = await query('contacts', 'POST', data);
        return (Array.isArray(result) ? result[0] : result) as Record<string, unknown>;
      },
    },
    leads: {
      async findById(id) {
        const { data } = await buildRaw('leads', { method: 'GET', params: { id: `eq.${id}`, limit: '1' } }).execute();
        return Array.isArray(data) ? data[0] as Record<string, unknown> : data as Record<string, unknown> | null;
      },
      async update(id, data) {
        await query('leads', 'PATCH', data, { id: `eq.${id}` });
      },
    },
    tasks: {
      async create(data) {
        const { data: result } = await query('tasks', 'POST', data);
        return (Array.isArray(result) ? result[0] : result) as Record<string, unknown>;
      },
      async update(id, data) {
        await query('tasks', 'PATCH', data, { id: `eq.${id}` });
      },
    },
    communications: {
      async create(data) {
        const { data: result } = await query('communications', 'POST', data);
        return (Array.isArray(result) ? result[0] : result) as Record<string, unknown>;
      },
    },
    workflowRuns: {
      async create(data) {
        const { data: result } = await query('workflow_runs', 'POST', data);
        return (Array.isArray(result) ? result[0] : result) as Record<string, unknown>;
      },
      async update(id, data) {
        await query('workflow_runs', 'PATCH', data, { id: `eq.${id}` });
      },
    },
    kpiSnapshots: {
      async upsert(data) {
        await query('kpi_snapshots', 'POST', data, { on_conflict: 'snapshot_date,period_type,agent_id' });
      },
    },
    raw: (table: string) => buildRaw(table, { method: 'GET', params: {} }),
  };
}