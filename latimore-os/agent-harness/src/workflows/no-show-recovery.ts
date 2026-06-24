/**
 * WORKFLOW: no-show-recovery
 * Triggered when an appointment is marked as no-show
 * Research → Draft Recovery Message → Compliance → Send → CRM Update
 */

import type { WorkflowDefinition } from '../types';

export const noShowRecoveryWorkflow: WorkflowDefinition = {
  name: 'no-show-recovery',
  version: '1.0.0',
  description: 'Empathetic recovery sequence for no-show appointments',
  trigger: { type: 'no_show' },
  timeout_ms: 45000,
  max_retries: 1,
  compliance_required: true,
  steps: [
    {
      id: 'research',
      name: 'Research Contact',
      worker: 'ResearchWorker',
      output_key: 'contact_profile',
      timeout_ms: 10000,
    },
    {
      id: 'draft_recovery',
      name: 'Draft Recovery Message',
      worker: 'DraftWorker',
      depends_on: ['research'],
      input_map: {
        draft_type: 'draft_type',
        contact_summary: 'contact_profile.contact_summary',
        contact: 'contact_profile.contact',
        first_name: 'first_name',
      },
      output_key: 'draft',
      timeout_ms: 20000,
    },
    {
      id: 'compliance_check',
      name: 'Compliance Review',
      worker: 'ComplianceReviewer',
      depends_on: ['draft_recovery'],
      input_map: { content: 'draft.body' },
      output_key: 'compliance',
      timeout_ms: 15000,
    },
    {
      id: 'send_recovery',
      name: 'Send Recovery Message',
      worker: 'SendWorker',
      depends_on: ['compliance_check'],
      input_map: {
        draft: 'draft',
        compliance: 'compliance',
        email: 'email',
        phone: 'phone',
        first_name: 'first_name',
        contact_id: 'contact_id',
      },
      output_key: 'send_result',
      timeout_ms: 15000,
    },
    {
      id: 'mark_no_show',
      name: 'Update CRM — No Show',
      worker: 'CRMWorker',
      depends_on: ['send_recovery'],
      input_map: {
        action: 'crm_action',
        contact_id: 'contact_id',
        appointment_id: 'appointment_id',
        contact_name: 'contact_name',
      },
      output_key: 'crm_result',
      timeout_ms: 10000,
    },
  ],
};

export const noShowRecoveryDefaults = {
  draft_type: 'no_show_recovery',
  crm_action: 'mark_no_show',
};