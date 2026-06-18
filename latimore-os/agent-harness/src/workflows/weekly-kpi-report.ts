/**
 * WORKFLOW: weekly-kpi-report
 * Triggered every Monday 9am ET via cron
 * Analytics → AI Insights → Pipeline Health → Agent Performance → Report
 */

import type { WorkflowDefinition } from '../types';

export const weeklyKPIReportWorkflow: WorkflowDefinition = {
  name: 'weekly-kpi-report',
  version: '1.0.0',
  description: 'Weekly KPI analysis with AI-powered insights and recommendations',
  trigger: { type: 'scheduled' },
  timeout_ms: 120000,
  max_retries: 1,
  compliance_required: false,
  steps: [
    // Run all three analytics in parallel
    {
      id: 'weekly_summary',
      name: 'Generate Weekly Summary',
      worker: 'AnalyticsWorker',
      input_map: { report_type: 'weekly_summary_type' },
      output_key: 'weekly_summary',
      timeout_ms: 30000,
    },
    {
      id: 'pipeline_health',
      name: 'Analyze Pipeline Health',
      worker: 'AnalyticsWorker',
      input_map: { report_type: 'pipeline_health_type' },
      output_key: 'pipeline_health',
      timeout_ms: 20000,
    },
    {
      id: 'lead_sources',
      name: 'Analyze Lead Sources',
      worker: 'AnalyticsWorker',
      input_map: { report_type: 'lead_source_type' },
      output_key: 'lead_sources',
      timeout_ms: 20000,
    },
    {
      id: 'agent_performance',
      name: 'Analyze Agent Performance',
      worker: 'AnalyticsWorker',
      input_map: { report_type: 'agent_performance_type' },
      output_key: 'agent_performance',
      timeout_ms: 20000,
    },
  ],
};

export const weeklyKPIReportDefaults = {
  weekly_summary_type: 'weekly_summary',
  pipeline_health_type: 'pipeline_health',
  lead_source_type: 'lead_source_analysis',
  agent_performance_type: 'agent_performance',
};