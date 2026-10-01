/**
 * GBP Publish Worker
 * Publishes a compliance-approved draft as a Google Business Profile local post.
 *
 * Safety gates (all must pass):
 *  1. The workflow must explicitly opt in via publish_to_gbp=true
 *     (the workflow step is also skipped unless that flag is set).
 *  2. Compliance review must have passed (compliance.passed === true).
 *  3. A GBP location must be configured (GBP_LOCATION_NAME env or input).
 *
 * Until Google approves the project's "Application for Basic API Access",
 * publish attempts fail with a clear GbpNotApprovedError — the worker reports
 * it honestly and never fabricates a post.
 */

import { BaseWorker } from '../types';
import type { WorkerInput, WorkerOutput, WorkerEnv } from '../types';
import {
  createLocalPost,
  GbpNotApprovedError,
  GbpNotConnectedError,
} from '@/lib/gbp/client';

const LOCATION_RE = /^accounts\/[^/]+\/locations\/[^/]+$/;

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

    this.log(`Publishing GBP local post to ${locationName} (${summary.length} chars)`);

    try {
      const post = await createLocalPost({
        locationName,
        summary,
        callToAction: ctaUrl ? { actionType: 'LEARN_MORE', url: ctaUrl } : undefined,
        mediaUrl,
      });

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
