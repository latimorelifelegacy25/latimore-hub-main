/**
 * Tests for the four GBP connect-path bug fixes.
 *
 * Run: npx tsx --test latimore-os/agent-harness/src/__tests__/gbp-connect-bugs.test.ts
 *
 * No live Google calls are made anywhere in this file — global fetch is
 * mocked for every test.
 */
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  exchangeGbpCode,
  getGbpRedirectUri,
  buildGbpAuthUrl,
} from '../../../../lib/gbp/oauth';
import {
  listGbpAccounts,
  listGbpLocations,
  createLocalPost,
} from '../../../../lib/gbp/http';
import { GBPPublishWorker } from '../workers/gbp-publish-worker';
import { ComplianceReviewer } from '../workers/compliance-reviewer';
import type { WorkerEnv, WorkerInput } from '../types';

function wi(input: Record<string, unknown>): WorkerInput {
  return { context: {} as WorkerInput['context'], step: {} as WorkerInput['step'], ...input };
}

// ── fetch mock ───────────────────────────────────────────────────────────────

type CapturedRequest = { url: string; method: string; body: string };
let captured: CapturedRequest[] = [];
let mockHandler: ((url: string, init?: RequestInit) => unknown) | null = null;

function jsonResponse(payload: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  };
}

beforeEach(() => {
  captured = [];
  mockHandler = null;
  (globalThis as unknown as { fetch: unknown }).fetch = async (
    url: unknown,
    init?: RequestInit,
  ) => {
    const u = String(url);
    captured.push({ url: u, method: init?.method || 'GET', body: String(init?.body || '') });
    if (!mockHandler) throw new Error(`Unexpected fetch with no mock handler: ${u}`);
    return mockHandler(u, init);
  };
});

afterEach(() => {
  delete (globalThis as unknown as { fetch?: unknown }).fetch;
});

function postCalls() {
  return captured.filter((c) => c.method === 'POST');
}

// ── Bug 1: OAuth callback must exchange with the GBP redirect URI ────────────

describe('Bug 1 — GBP token exchange uses the GBP redirect URI', () => {
  beforeEach(() => {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    process.env.GBP_REDIRECT_URI = 'https://hub.example.com/api/gbp/callback';
    process.env.GOOGLE_CALENDAR_REDIRECT_URI = 'https://hub.example.com/api/calendar/google/callback';
  });

  it('sends redirect_uri matching the GBP callback, not the calendar callback', async () => {
    mockHandler = (url) => {
      assert.equal(url, 'https://oauth2.googleapis.com/token');
      return jsonResponse({ access_token: 'tok123', expires_in: 3600 });
    };

    const tokens = await exchangeGbpCode('auth-code-xyz');

    assert.equal(tokens.access_token, 'tok123');
    assert.equal(postCalls().length, 1);
    const params = new URLSearchParams(postCalls()[0].body);
    assert.equal(params.get('redirect_uri'), 'https://hub.example.com/api/gbp/callback');
    assert.notEqual(params.get('redirect_uri'), process.env.GOOGLE_CALENDAR_REDIRECT_URI);
    assert.equal(params.get('code'), 'auth-code-xyz');
    assert.equal(params.get('grant_type'), 'authorization_code');
  });

  it('uses the same redirect URI as the authorization URL (round-trip consistency)', () => {
    const authUrl = new URL(buildGbpAuthUrl('state123'));
    assert.equal(authUrl.searchParams.get('redirect_uri'), getGbpRedirectUri());
    assert.equal(getGbpRedirectUri(), 'https://hub.example.com/api/gbp/callback');
  });

  it('throws when Google rejects the exchange', async () => {
    mockHandler = () => jsonResponse({ error: 'invalid_grant', error_description: 'Bad code' }, 400);
    await assert.rejects(() => exchangeGbpCode('bad-code'), /Bad code/);
  });
});

// ── Bug 2: account/location discovery on current hosts ───────────────────────

describe('Bug 2 — discovery uses current Google API hosts', () => {
  it('listGbpAccounts hits the Account Management v1 API', async () => {
    mockHandler = () => jsonResponse({ accounts: [{ name: 'accounts/123', accountName: 'Test' }] });
    const accounts = await listGbpAccounts('tok');
    assert.equal(accounts.length, 1);
    assert.equal(
      captured[0].url,
      'https://mybusinessaccountmanagement.googleapis.com/v1/accounts?pageSize=50',
    );
  });

  it('listGbpLocations hits the Business Information v1 API', async () => {
    mockHandler = () => jsonResponse({ locations: [{ name: 'accounts/123/locations/456', title: 'Shop' }] });
    const locations = await listGbpLocations('tok', 'accounts/123');
    assert.equal(locations.length, 1);
    assert.equal(
      captured[0].url,
      'https://mybusinessbusinessinformation.googleapis.com/v1/accounts/123/locations?pageSize=50&readMask=name,title',
    );
  });

  it('createLocalPost stays on the v4 localPosts endpoint (no v1 replacement exists)', async () => {
    mockHandler = () => jsonResponse({ name: 'accounts/123/locations/456/localPosts/789' });
    await createLocalPost(
      { locationName: 'accounts/123/locations/456', summary: 'Hello' },
      'tok',
    );
    assert.ok(captured[0].url.startsWith('https://mybusiness.googleapis.com/v4/accounts/123/locations/456/localPosts'));
  });
});

// ── Bug 3: compliance review fails closed ────────────────────────────────────

describe('Bug 3 — compliance review fails closed on error', () => {
  it('returns passed:false (never passed:true) when the review throws', async () => {
    const reviewer = new ComplianceReviewer();
    // Force the error path deterministically.
    (reviewer as unknown as { runPatternCheck: () => never }).runPatternCheck = () => {
      throw new Error('simulated review crash');
    };

    const result = await reviewer.execute(
      wi({ content: 'Some perfectly fine marketing copy. '.repeat(10) }),
      {} as WorkerEnv,
    );

    const data = result.data as { passed: boolean; violations: Array<{ rule: string; severity: string }> };
    assert.equal(data.passed, false);
    assert.ok(data.violations.some((v) => v.rule === 'REVIEW_ERROR' && v.severity === 'critical'));
  });

  it('GBPPublishWorker refuses to publish when compliance did not pass', async () => {
    const worker = new GBPPublishWorker();
    const result = await worker.execute(
      wi({
        publish_to_gbp: true,
        compliance: { passed: false, violations: [{ rule: 'REVIEW_ERROR', severity: 'critical' }] },
        draft: { body: 'Buy now, guaranteed returns!' },
        location_name: 'accounts/123/locations/456',
        google_access_token: 'tok',
      }),
      {} as WorkerEnv,
    );

    assert.equal(result.success, false);
    assert.match(String(result.error), /Compliance review did not pass/);
    assert.equal(captured.length, 0, 'no Google API call may be attempted');
  });
});

// ── Bug 4: retry never duplicates a post ─────────────────────────────────────

describe('Bug 4 — publish retries never create duplicate posts', () => {
  const baseInput = {
    publish_to_gbp: true,
    compliance: { passed: true, violations: [] },
    draft: { body: 'Protecting Today. Securing Tomorrow. Call (570) 900-1977.' },
    location_name: 'accounts/123/locations/456',
    google_access_token: 'tok',
  };
  const createdPost = {
    name: 'accounts/123/locations/456/localPosts/postABC',
    summary: 'Protecting Today. Securing Tomorrow. Call (570) 900-1977.',
    state: 'LIVE',
    searchUrl: 'https://example.com/search',
    createTime: new Date().toISOString(),
  };

  it('second identical publish is suppressed as a duplicate (no second POST)', async () => {
    const worker = new GBPPublishWorker();
    let listCalls = 0;

    mockHandler = (url, init) => {
      if ((init?.method || 'GET') === 'POST') {
        return jsonResponse(createdPost);
      }
      listCalls += 1;
      // First execution: nothing published yet. Retry: the post exists.
      return jsonResponse({ localPosts: listCalls === 1 ? [] : [createdPost] });
    };

    const first = await worker.execute(wi({ ...baseInput }), {} as WorkerEnv);
    assert.equal(first.success, true);
    assert.equal((first.data as { deduped: boolean }).deduped, false);
    assert.equal(postCalls().length, 1);

    const retry = await worker.execute(wi({ ...baseInput }), {} as WorkerEnv);
    assert.equal(retry.success, true);
    assert.equal((retry.data as { deduped: boolean }).deduped, true);
    assert.equal((retry.data as { post_name: string }).post_name, createdPost.name);
    assert.ok((retry.actions_taken || []).includes('gbp_duplicate_suppressed'));
    assert.equal(postCalls().length, 1, 'retry must not issue a second POST');
  });

  it('different content still publishes (dedupe is identity-based, not a blanket block)', async () => {
    const worker = new GBPPublishWorker();
    mockHandler = (url, init) => {
      if ((init?.method || 'GET') === 'POST') return jsonResponse({ name: 'accounts/123/locations/456/localPosts/other' });
      return jsonResponse({ localPosts: [createdPost] }); // unrelated existing post
    };

    const result = await worker.execute(
      wi({ ...baseInput, draft: { body: 'A completely different announcement.' } }),
      {} as WorkerEnv,
    );
    assert.equal(result.success, true);
    assert.equal((result.data as { deduped: boolean }).deduped, false);
    assert.equal(postCalls().length, 1);
  });
});
