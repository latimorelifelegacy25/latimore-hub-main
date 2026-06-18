/**
 * WORKFLOW: gbp-post-draft
 * Drafts Google Business Profile posts and social content
 * Draft → Compliance Review → Store in content_posts table
 */

import type { WorkflowDefinition } from '../types';

export const gbpPostDraftWorkflow: WorkflowDefinition = {
  name: 'gbp-post-draft',
  version: '1.0.0',
  description: 'AI-drafted Google Business Profile and social media posts with compliance review',
  trigger: { type: 'manual' },
  timeout_ms: 60000,
  max_retries: 1,
  compliance_required: true,
  steps: [
    {
      id: 'draft_post',
      name: 'Draft Social Post',
      worker: 'DraftWorker',
      input_map: {
        draft_type: 'draft_type',
        platform: 'platform',
        topic: 'topic',
        content_pillar: 'content_pillar',
      },
      output_key: 'draft',
      timeout_ms: 25000,
      retry_on_failure: true,
    },
    {
      id: 'compliance_check',
      name: 'Compliance Review',
      worker: 'ComplianceReviewer',
      depends_on: ['draft_post'],
      input_map: {
        content: 'draft.body',
        use_ai_review: 'use_ai_review',
      },
      output_key: 'compliance',
      timeout_ms: 20000,
    },
    {
      id: 'store_post',
      name: 'Store Draft in CRM',
      worker: 'CRMWorker',
      depends_on: ['compliance_check'],
      input_map: {
        action: 'store_action',
        platform: 'platform',
        topic: 'topic',
        content_pillar: 'content_pillar',
        draft: 'draft',
        compliance: 'compliance',
      },
      output_key: 'store_result',
      timeout_ms: 10000,
    },
  ],
};

export const gbpPostDraftDefaults = {
  draft_type: 'social_post',
  platform: 'facebook',
  content_pillar: 'education',
  use_ai_review: true,
  store_action: 'store_content_post',
};