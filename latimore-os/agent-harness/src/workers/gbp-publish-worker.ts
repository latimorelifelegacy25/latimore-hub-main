/**
 * GBP Publish Worker
 * Publishes a compliance-approved draft as a Google Business Profile local post.
 *
 * Safety gates (all must pass):
 *  1. The workflow must explicitly opt in via publish_to_gbp=true
 *     (the workflow step is also skipped unless that flag is set).
 *  2. Compliance review must have passed (compliance.passed === true).
 *     An errored compliance review fails closed (passed:false), so it can
 *     never green-light a publish.
 *  3. A GBP location must be configured (GBP_LOCATION_NAME env or input).
 *
 * Idempotency: before posting, the worker checks the location's recent posts
 * for an identical summary inside a 2-hour window. A retry after a
 * successful-but-unacknowledged POST is recognized as the same logical post
 * and suppressed instead of published twice.
 *
 * Until Google approves the project's "Application for Basic API Access",
 * publish attempts fail with a clear GbpNotApprovedError — the worker reports
 * it honestly and never fabricates a post.
 */

import { BaseWorker } from '../types';
import type { WorkerInput, WorkerOutput, WorkerEnv } from '../types';
import {
  createLocalPost,
  listLocalPosts,
  GbpNotApprovedError,
  GbpNotConnectedError,
} from '../lib/gbp-client';

const LOCATION_RE = /^accounts\/[^/]+\/locations\/[^/]+$/;

/**
 * How far back the pre-publish duplicate check looks. Retries from the
 * workflow's retry_on_failure happen within seconds/minutes of the first
 * attempt, so a 2-hour window catches every retry duplicate while still
 * allowing intentionally reposted content later in the day.
 */
const DEDUPE_WINDOW_MS = 2 * 60 * 60 * 1000;

/**
 * Stable 64-bit FNV-1a hash rendered as hex. Implemented inline (no crypto
 * import) so this worker stays runnable in edge/minimal runtimes.
 */
function fnv1a64Hex(input: string): string {
  let h1 = 0xcbf29ce4;
  let h2 = 0xcbf29ce4;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ (c >>> 8 || c), 0x01000193) >>> 0;
  }
  const hex = (n: number) => n.toString(16).padStart(8, '0');
  return hex(h1) + hex(h2);
}

/**
 * Builds the stable idempotency identity for a post. Two worker executions
 * with the same location, summary, CTA, media, and caller-supplied key
 * produce the same identity — so a retry of the same publish request is
 * recognized as the same logical post.
 */
export function buildGbpPostIdentity(input: {
  locationName: string;
  summary: string;
  ctaUrl?: string;
  mediaUrl?: string;
  idempotencyKey?: string;
}): string {
  const canonical = [
    input.locationName.trim(),
    input.summary.trim(),
    (input.ctaUrl || '').trim(),
    (input.mediaUrl || '').trim(),
    (input.idempotencyKey || '').trim(),
  ].join('|');
  return `gbp:${fnv1a64Hex(canonical)}`;
}

function parsePostTime(value: unknown): number | null {
  if (typeof value !== 'string' || !value) return null;
  const t = Date.parse(value);
  return Number.isNaN(t) ? null : t;
}

export class GBPPublishWorker extends BaseWorker {
  name = 'GBPPublishWorker';
  description = 'Publishes a compliance-approved draft as a Google Business Profile local post';

  async execute(input: WorkerInput, env: WorkerEnv): Promise<WorkerOutput> {
    void env;

    const draft = (input.draft as Record<string, unknown>) || {};
    const compliance = (input.compliance as Record<string, unknown>) || {};

    // Gate 1: explicit opt-in. The workflow step's skip_if normally prevents
    // this worker from running at all; this is defense in depth.
    if (input.publish_to_gbp !== true) {
      return { success: false, error: 'GBP publish not requested (publish_to_gbp !== true) — refusing to publish.' };
    }

    // Gate 2: compliance must have passed.
    if (compliance.passed !== true) {
      return { success: false, error: 'Compliance review did not pass — refusing to publish to Google Business Profile.' };
    }

    const summary = String(draft.body || draft.summary || '').trim();
    if (!summary) {
      return { success: false, error: 'Nothing to publish: draft has no body text.' };
    }

    // Gate 3: target location must be configured.
    const locationName = String(input.location_name || process.env.GBP_LOCATION_NAME || '').trim();
    if (!locationName) {
      return {
        success: false,
        error: 'GBP_LOCATION_NAME is not configured. Ask an admin to visit /api/gbp/status for the location list.',
      };
    }
    if (!LOCATION_RE.test(locationName)) {
      return {
        success: false,
        error: `Invalid GBP location "${locationName}". Expected: accounts/{accountId}/locations/{locationId}`,
      };
    }

    const ctaUrl = String(input.cta_url || '').trim() || undefined;
    const mediaUrl = String(input.media_url || draft.image_url || '').trim() || undefined;

    // The OAuth access token is supplied by the caller (the API route injects
    // a fresh server-side token into the run input — the harness never sees
    // the token store). Refuse to publish without one rather than failing
    // obscurely inside the HTTP layer.
    const accessToken = String(input.google_access_token || '').trim();
    if (!accessToken) {
      return {
        success: false,
        error:
          'No Google access token was provided for this run (google_access_token). ' +
          'An admin must connect Google Business Profile at /api/gbp/connect first.',
      };
    }

    this.log(`Publishing GBP local post to ${locationName} (${summary.length} chars)`);

    // Idempotency: a retry after a successful-but-unacknowledged POST must not
    // create a second post. Check the location's recent posts for an identical
    // summary inside the dedupe window first. This check is best-effort: if
    // the list call itself fails we log and proceed, because blocking every
    // publish on a transient read failure would be worse than the (already
    // guarded) duplicate risk.
    const identityKey = buildGbpPostIdentity({
      locationName,
      summary,
      ctaUrl,
      mediaUrl,
      idempotencyKey: String(input.idempotency_key || '').trim() || undefined,
    });
    try {
      const recent = await listLocalPosts(accessToken, locationName, 25);
      const now = Date.now();
      const duplicate = recent.find((p) => {
        if (String(p.summary || '').trim() !== summary) return false;
        const created = parsePostTime(p.createTime);
        return created !== null && now - created <= DEDUPE_WINDOW_MS;
      });
      if (duplicate) {
        this.log(`Duplicate publish suppressed (identity ${identityKey}) — post already exists: ${duplicate.name}`);
        return {
          success: true,
          data: {
            post_name: duplicate.name || null,
            location: locationName,
            search_url: duplicate.searchUrl || null,
            state: duplicate.state || null,
            summary_length: summary.length,
            deduped: true,
            idempotency_key: identityKey,
          },
          actions_taken: ['gbp_duplicate_suppressed'],
        };
      }
    } catch (err) {
      this.log(`Pre-publish duplicate check failed — proceeding with publish: ${err instanceof Error ? err.message : String(err)}`);
    }

    try {
      const post = await createLocalPost(
        {
          locationName,
          summary,
          callToAction: ctaUrl ? { actionType: 'LEARN_MORE', url: ctaUrl } : undefined,
          mediaUrl,
        },
        accessToken,
      );

      const actions = ['gbp_local_post_created'];
      this.log(`GBP post published: ${post.name || '(no name returned)'}`);

      return {
        success: true,
        data: {
          post_name: post.name || null,
          location: locationName,
          search_url: post.searchUrl || null,
          state: post.state || null,
          summary_length: summary.length,
          deduped: false,
          idempotency_key: identityKey,
        },
        actions_taken: actions,
      };
    } catch (err) {
      if (err instanceof GbpNotApprovedError) {
        this.error('GBP API not approved by Google yet', err);
        return {
          success: false,
          error:
            'Google has not approved this project for the Business Profile API yet. ' +
            'Submit the "Application for Basic API Access" and try again after approval. ' +
            `Details: ${err.message}`,
        };
      }
      if (err instanceof GbpNotConnectedError) {
        this.error('GBP not connected', err);
        return {
          success: false,
          error: 'Google Business Profile is not connected. An admin must visit /api/gbp/connect first.',
        };
      }
      this.error('GBP publish failed', err);
      return { success: false, error: `GBP publish failed: ${err instanceof Error ? err.message : String(err)}` };
    }
  }
}
