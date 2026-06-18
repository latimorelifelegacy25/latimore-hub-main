/**
 * Analytics Worker
 * Aggregates KPI data and generates insights using LLM
 */

import { BaseWorker } from '../types';
import type { WorkerInput, WorkerOutput, WorkerEnv } from '../types';
import { createDBClient } from '../lib/supabase';
import { callOpenAI, LATIMORE_SYSTEM_PROMPT } from '../lib/llm';

export class AnalyticsWorker extends BaseWorker {
  name = 'AnalyticsWorker';
  description = 'Aggregates KPI data and generates AI-powered insights';

  async execute(input: WorkerInput, env: WorkerEnv): Promise<WorkerOutput> {
    const db = createDBClient(env);
    const reportType = input.report_type as string || 'weekly_summary';

    this.log(`Generating analytics: ${reportType}`);

    try {
      switch (reportType) {
        case 'weekly_summary':
          return await this.generateWeeklySummary(db, env);
        case 'pipeline_health':
          return await this.generatePipelineHealth(db, env);
        case 'lead_source_analysis':
          return await this.generateLeadSourceAnalysis(db, env);
        case 'agent_performance':
          return await this.generateAgentPerformance(db, env);
        default:
          return await this.generateWeeklySummary(db, env);
      }
    } catch (err) {
      this.error('Analytics failed', err);
      return { success: false, error: String(err) };
    }
  }

  // ── WEEKLY SUMMARY ─────────────────────────────────────────────────────────

  private async generateWeeklySummary(
    db: ReturnType<typeof createDBClient>,
    env: WorkerEnv
  ): Promise<WorkerOutput> {
    // Fetch recent KPI snapshots
    const { data: snapshots } = await db.raw('kpi_snapshots')
      .select('*')
      .eq('period_type', 'weekly')
      .order('snapshot_date', { ascending: false })
      .limit(4)
      .execute();

    const snapshotList = Array.isArray(snapshots) ? snapshots as Record<string, unknown>[] : [];

    // Fetch pipeline summary
    const { data: pipeline } = await db.raw('v_active_pipeline')
      .select('lead_status, count(*)')
      .limit(100)
      .execute();

    // Build data summary for LLM
    const dataSummary = buildKPISummary(snapshotList);

    // Generate AI insights
    const insightsResponse = await callOpenAI(env, [
      { role: 'system', content: LATIMORE_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Analyze this weekly KPI data for Latimore Life & Legacy and provide actionable insights.

${dataSummary}

Provide:
1. Top 3 wins this week
2. Top 3 areas needing attention
3. One specific action recommendation for next week
4. One motivational insight tied to the mission "Protecting Today. Securing Tomorrow."

Keep it concise, specific, and actionable. Return JSON with keys:
- wins: string[] (3 items)
- attention_areas: string[] (3 items)
- next_week_action: string
- mission_insight: string`
      }
    ], { json: true, temperature: 0.4, max_tokens: 600 });

    let insights = {
      wins: ['Production is on track', 'Lead pipeline is growing', 'Community presence is building'],
      attention_areas: ['Follow-up cadence needs consistency', 'Annuity pipeline needs attention', 'Recruiting conversations need to increase'],
      next_week_action: 'Focus on converting assessment_scheduled contacts to proposal_sent',
      mission_insight: 'Every policy placed is a family protected. Keep going. #TheBeatGoesOn',
    };

    try {
      insights = JSON.parse(insightsResponse.content);
    } catch {
      this.log('Using default insights (LLM parse failed)');
    }

    return {
      success: true,
      data: {
        report_type: 'weekly_summary',
        snapshots: snapshotList,
        insights,
        generated_at: new Date().toISOString(),
      },
      tokens_used: insightsResponse.tokens_used,
      actions_taken: ['fetched_kpi_snapshots', 'generated_ai_insights'],
    };
  }

  // ── PIPELINE HEALTH ────────────────────────────────────────────────────────

  private async generatePipelineHealth(
    db: ReturnType<typeof createDBClient>,
    env: WorkerEnv
  ): Promise<WorkerOutput> {
    const { data: pipeline } = await db.raw('v_active_pipeline')
      .select('id, full_name, lead_status, lead_source, next_follow_up_at, last_contacted_at, lead_created_at')
      .limit(200)
      .execute();

    const contacts = Array.isArray(pipeline) ? pipeline as Record<string, unknown>[] : [];

    // Identify stale contacts (no follow-up in 7+ days)
    const now = Date.now();
    const staleContacts = contacts.filter(c => {
      const lastContact = c.last_contacted_at ? new Date(c.last_contacted_at as string).getTime() : new Date(c.lead_created_at as string).getTime();
      return (now - lastContact) > 7 * 24 * 3600000;
    });

    // Identify overdue follow-ups
    const overdueFollowUps = contacts.filter(c => {
      if (!c.next_follow_up_at) return false;
      return new Date(c.next_follow_up_at as string).getTime() < now;
    });

    // Status distribution
    const statusDist = contacts.reduce((acc, c) => {
      const status = c.lead_status as string;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      success: true,
      data: {
        report_type: 'pipeline_health',
        total_active: contacts.length,
        stale_contacts: staleContacts.length,
        overdue_follow_ups: overdueFollowUps.length,
        status_distribution: statusDist,
        health_score: calculateHealthScore(contacts.length, staleContacts.length, overdueFollowUps.length),
        generated_at: new Date().toISOString(),
      },
      actions_taken: ['fetched_pipeline', 'calculated_health_score'],
    };
  }

  // ── LEAD SOURCE ANALYSIS ───────────────────────────────────────────────────

  private async generateLeadSourceAnalysis(
    db: ReturnType<typeof createDBClient>,
    env: WorkerEnv
  ): Promise<WorkerOutput> {
    const { data: leads } = await db.raw('leads')
      .select('id, source, created_at, is_processed, contact_id')
      .order('created_at', { ascending: false })
      .limit(500)
      .execute();

    const leadList = Array.isArray(leads) ? leads as Record<string, unknown>[] : [];

    // Source breakdown
    const sourceBreakdown = leadList.reduce((acc, l) => {
      const source = l.source as string || 'unknown';
      if (!acc[source]) acc[source] = { total: 0, converted: 0 };
      acc[source].total++;
      if (l.contact_id) acc[source].converted++;
      return acc;
    }, {} as Record<string, { total: number; converted: number }>);

    // Calculate conversion rates
    const sourceAnalysis = Object.entries(sourceBreakdown).map(([source, data]) => ({
      source,
      total_leads: data.total,
      converted: data.converted,
      conversion_rate: data.total > 0 ? ((data.converted / data.total) * 100).toFixed(1) + '%' : '0%',
    })).sort((a, b) => b.total_leads - a.total_leads);

    return {
      success: true,
      data: {
        report_type: 'lead_source_analysis',
        total_leads: leadList.length,
        source_breakdown: sourceAnalysis,
        top_source: sourceAnalysis[0]?.source || 'unknown',
        generated_at: new Date().toISOString(),
      },
      actions_taken: ['fetched_leads', 'calculated_source_breakdown'],
    };
  }

  // ── AGENT PERFORMANCE ──────────────────────────────────────────────────────

  private async generateAgentPerformance(
    db: ReturnType<typeof createDBClient>,
    env: WorkerEnv
  ): Promise<WorkerOutput> {
    const { data: leaderboard } = await db.raw('v_agent_leaderboard')
      .select('agent_id, agent_name, status, ytd_premium, ytd_policies, ytd_annuity, total_contacts, closed_clients')
      .limit(20)
      .execute();

    const agents = Array.isArray(leaderboard) ? leaderboard as Record<string, unknown>[] : [];

    const totalAgencyPremium = agents.reduce((sum, a) => sum + (Number(a.ytd_premium) || 0), 0);
    const activeAgents = agents.filter(a => a.status === 'active').length;

    return {
      success: true,
      data: {
        report_type: 'agent_performance',
        total_agents: agents.length,
        active_agents: activeAgents,
        total_agency_premium: totalAgencyPremium,
        leaderboard: agents,
        generated_at: new Date().toISOString(),
      },
      actions_taken: ['fetched_agent_leaderboard'],
    };
  }
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

function buildKPISummary(snapshots: Record<string, unknown>[]): string {
  if (snapshots.length === 0) return 'No KPI data available yet.';

  const latest = snapshots[0];
  const previous = snapshots[1];

  const lines = [
    `Latest week (${latest.snapshot_date}):`,
    `  New Leads: ${latest.new_leads || 0}`,
    `  Appointments Set: ${latest.appointments_set || 0}`,
    `  Appointments Held: ${latest.appointments_held || 0}`,
    `  Policies Issued: ${latest.policies_issued || 0}`,
    `  Premium Written: $${Number(latest.premium_written || 0).toLocaleString()}`,
    `  Annuity Premium: $${Number(latest.annuity_premium || 0).toLocaleString()}`,
    `  Active Agents: ${latest.active_agents || 0}`,
  ];

  if (previous) {
    lines.push('');
    lines.push(`Previous week (${previous.snapshot_date}):`,
      `  New Leads: ${previous.new_leads || 0}`,
      `  Policies Issued: ${previous.policies_issued || 0}`,
      `  Premium Written: $${Number(previous.premium_written || 0).toLocaleString()}`
    );
  }

  return lines.join('\n');
}

function calculateHealthScore(total: number, stale: number, overdue: number): number {
  if (total === 0) return 100;
  const staleRatio = stale / total;
  const overdueRatio = overdue / total;
  const score = 100 - (staleRatio * 40) - (overdueRatio * 30);
  return Math.max(0, Math.min(100, Math.round(score)));
}