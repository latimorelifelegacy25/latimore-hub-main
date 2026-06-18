/**
 * Supabase client for Cloudflare Worker (fetch-based, no Node.js deps)
 */

import type { Env } from '../index';

export interface SupabaseClient {
  from: (table: string) => QueryBuilder;
  rpc: (fn: string, params?: Record<string, unknown>) => Promise<SupabaseResponse>;
}

export interface SupabaseResponse {
  data: unknown;
  error: SupabaseError | null;
  status: number;
}

export interface SupabaseError {
  message: string;
  code?: string;
  details?: string;
}

interface QueryBuilder {
  select: (columns?: string) => QueryBuilder;
  insert: (data: Record<string, unknown> | Record<string, unknown>[]) => Promise<SupabaseResponse>;
  update: (data: Record<string, unknown>) => QueryBuilder;
  upsert: (data: Record<string, unknown> | Record<string, unknown>[]) => Promise<SupabaseResponse>;
  eq: (column: string, value: unknown) => QueryBuilder;
  single: () => Promise<SupabaseResponse>;
  limit: (n: number) => QueryBuilder;
  order: (column: string, opts?: { ascending?: boolean }) => QueryBuilder;
  then: (resolve: (value: SupabaseResponse) => void) => Promise<void>;
}

export function createSupabaseClient(env: Env): SupabaseClient {
  const baseUrl = env.SUPABASE_URL;
  const apiKey = env.SUPABASE_SERVICE_ROLE_KEY;

  const headers = {
    'Content-Type': 'application/json',
    'apikey': apiKey,
    'Authorization': `Bearer ${apiKey}`,
    'Prefer': 'return=representation',
  };

  async function fetchSupabase(
    path: string,
    method: string,
    body?: unknown,
    queryParams?: Record<string, string>
  ): Promise<SupabaseResponse> {
    let url = `${baseUrl}/rest/v1/${path}`;
    if (queryParams && Object.keys(queryParams).length > 0) {
      const params = new URLSearchParams(queryParams);
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const status = response.status;
    let data: unknown = null;
    let error: SupabaseError | null = null;

    try {
      const text = await response.text();
      if (text) {
        const parsed = JSON.parse(text);
        if (status >= 400) {
          error = { message: parsed.message || 'Unknown error', code: parsed.code, details: parsed.details };
        } else {
          data = parsed;
        }
      }
    } catch {
      if (status >= 400) {
        error = { message: 'Failed to parse error response' };
      }
    }

    return { data, error, status };
  }

  function buildQueryBuilder(table: string, state: {
    method: string;
    filters: Record<string, string>;
    selectCols: string;
    limitVal?: number;
    orderCol?: string;
    orderAsc?: boolean;
    body?: unknown;
    isSingle?: boolean;
  }): QueryBuilder {
    const execute = async (): Promise<SupabaseResponse> => {
      const queryParams: Record<string, string> = { ...state.filters };
      if (state.selectCols && state.selectCols !== '*') {
        queryParams['select'] = state.selectCols;
      } else if (state.method === 'GET') {
        queryParams['select'] = state.selectCols || '*';
      }
      if (state.limitVal !== undefined) {
        queryParams['limit'] = String(state.limitVal);
      }
      if (state.orderCol) {
        queryParams['order'] = `${state.orderCol}.${state.orderAsc === false ? 'desc' : 'asc'}`;
      }
      if (state.isSingle) {
        queryParams['limit'] = '1';
      }

      const result = await fetchSupabase(table, state.method, state.body, queryParams);

      if (state.isSingle && Array.isArray(result.data)) {
        return { ...result, data: result.data[0] ?? null };
      }
      return result;
    };

    const builder: QueryBuilder = {
      select(columns = '*') {
        return buildQueryBuilder(table, { ...state, selectCols: columns, method: 'GET' });
      },
      async insert(data) {
        return fetchSupabase(table, 'POST', data);
      },
      update(data) {
        return buildQueryBuilder(table, { ...state, method: 'PATCH', body: data });
      },
      async upsert(data) {
        return fetchSupabase(table, 'POST', data, { on_conflict: 'id' });
      },
      eq(column, value) {
        return buildQueryBuilder(table, {
          ...state,
          filters: { ...state.filters, [column]: `eq.${value}` },
        });
      },
      single() {
        return buildQueryBuilder(table, { ...state, isSingle: true }).then(r => r) as Promise<SupabaseResponse>;
      },
      limit(n) {
        return buildQueryBuilder(table, { ...state, limitVal: n });
      },
      order(column, opts) {
        return buildQueryBuilder(table, { ...state, orderCol: column, orderAsc: opts?.ascending });
      },
      then(resolve) {
        return execute().then(resolve);
      },
    };

    return builder;
  }

  return {
    from(table: string) {
      return buildQueryBuilder(table, {
        method: 'GET',
        filters: {},
        selectCols: '*',
      });
    },
    async rpc(fn: string, params?: Record<string, unknown>) {
      return fetchSupabase(`rpc/${fn}`, 'POST', params || {});
    },
  };
}