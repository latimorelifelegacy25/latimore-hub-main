/**
 * WORKFLOW: lead-follow-up
 * Triggered when a new lead is created
 * Research → Draft → Compliance Review → Send → CRM Update
 */

import type { WorkflowDefinition } from '../types';

export const leadFollowUpWorkflow: WorkflowDefinition = {
  name: 'lead-follow-up',
  version: '1.0.0',
  description: 'Automated follow-up sequence for new leads — research, draft, review, send',
  trigger: {
    type: 'lead_created',
  },
  timeout_ms: 60000,
  max_retries: 2,
  compliance_required: true,
  steps: [
    {
      id: 'research',
      name: 'Research Contact Profile',
      worker: 'ResearchWorker',
      output_key: 'contact_profile',
      timeout_ms: 10000,
      retry_on_failure: true,
    },
    {
      id: 'draft_email',
      name: 'Draft Follow-Up Email',
      worker: 'DraftWorker',
      depends_on: ['research'],
      input_map: {
        draft_type: 'draft_type',
        contact_summary: 'contact_profile.contact_summary',
        contact: 'contact_profile.contact',
        first_name: 'first_name',
        interest: 'interest',
        source: 'source',
      },
      output_key: 'draft',
      timeout_ms: 20000,
      retry_on_failure: true,
    },
    {
      id: 'compliance_check',
      name: 'Compliance Review',
      worker: 'ComplianceReviewer',
      depends_on: ['draft_email'],
      input_map: {
        content: 'draft.body',
        use_ai_review: 'use_ai_review',
      },
      output_key: 'compliance',
      timeout_ms: 15000,
    },
    {
      id: 'send_messages',
      name: 'Send Email & SMS',
      worker: 'SendWorker',
      depends_on: ['compliance_check'],
      input_map: {
        draft: 'draft',
        email: 'email',
        phone: 'phone',
        first_name: 'first_name',
        contact_id: 'contact_id',
        send_email: 'send_email',
        send_sms: 'send_sms',
      },
      output_key: 'send_result',
      timeout_ms: 15000,
      skip_if: '!context.email',
    },
    {
      id: 'update_crm',
      name: 'Update CRM Pipeline',
      worker: 'CRMWorker',
      depends_on: ['send_messages'],
      input_map: {
        action: 'crm_action',
        contact_id: 'contact_id',
        lead_status: 'new_lead_status',
        next_follow_up_at: 'next_follow_up_at',
      },
      output_key: 'crm_result',
      timeout_ms: 10000,
    },
    {
      id: 'create_followup_task',
      name: 'Create Follow-Up Task',
      worker: 'CRMWorker',
      depends_on: ['update_crm'],
      input_map: {
        action: 'task_action',
        contact_id: 'contact_id',
        task_title: 'task_title',
        task_type: 'task_type',
        priority: 'task_priority',
        due_hours: 'task_due_hours',
      },
      output_key: 'task_result',
      timeout_ms: 10000,
    },
  ],
};

// Default context values for this workflow
export const leadFollowUpDefaults = {
  draft_type: 'follow_up_email',
  crm_action: 'advance_pipeline',
  task_action: 'create_task',
  task_title: 'Follow up with new lead',
  task_type: 'follow_up',
  task_priority: 'high',
  task_due_hours: 48,
  new_lead_status: 'contacted',
  send_email: true,
  send_sms: true,
  use_ai_review: true,
};