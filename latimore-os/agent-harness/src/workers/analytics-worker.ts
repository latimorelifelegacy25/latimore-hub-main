/**
 * Analytics Worker
 * Calculates workflow KPIs from the canonical Prisma-managed Latimore CRM.
 */

import { BaseWorker } from '../types';
import type { WorkerInput, WorkerOutput, WorkerEnv } from '../types';
import { createDBClient } from '../lib/supabase';
import { callOpenAI, LATIMORE_SYSTEM_PROMPT } from '../lib/llm';

function asRows(data: unknown): Record<string, unknown>[] {
  return Array.isArray(data) ? data as Record<string, unknown>[] : [];
}

function dateMs(value: unknown): number {
  if (!value) return 0;
  const ms = new Date(String(value)).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

export class AnalyticsWorker extends BaseWorker {
  name = 'AnalyticsWorker';
  description = 'Calculates KPI and pipeline analytics from canonical Latimore CRM tables';

  async execute(input: WorkerInput, env: WorkerEnv): Promise<WorkerOutput> {
    const db = createDBClient(env);
    const reportType = (input.report_type as string) || 'weekly_summary';

    this.log(`Generating canonical analytics: ${reportType}`);

    try {
      switch (reportType) {
        case 'weekly_summary':
          return await this.generateWeeklySummary(db, env);
        case 'pipeline_health':
          return await this.generatePipelineHealth(db);
        case 'lead_source_analysis':
          return await this.generateLeadSourceAnalysis(db);
        case 'agent_performance':
          return await this.generateAgencyPerformance(db);
        default:
          return await this.generateWeeklySummary(db, env);
      }
    } catch (err) {
      this.error('Analytics failed', err);
      return { success: false, error: String(err) };
    }
  }

  private async generateWeeklySummary(
    db: ReturnType<typeof createDBClient>,
    env: WorkerEnv,
  ): Promise<WorkerOutput> {
    const [contactsResult, inquiriesResult, appointmentsResult] = await Promise.all([
      db.raw('Contact').select('id,createdAt,status,lastActivityAt').order('createdAt', { ascending: false }).limit(500).execute(),
      db.raw('Inquiry').select('id,createdAt,status,stage,source,leadScore').order('createdAt', { ascending: false }).limit(500).execute(),
      db.raw('Appointment').select('id,createdAt,scheduledFor,status').order('createdAt', { ascending: false }).limit(500).execute(),
    ]);

    if (contactsResult.error) throw new Error(`Contact analytics failed: ${JSON.stringify(contactsResult.error)}`);
    if (inquiriesResult.error) throw new Error(`Inquiry analytics failed: ${JSON.stringify(inquiriesResult.error)}`);
    if (appointmentsResult.error) throw new Error(`Appointment analytics failed: ${JSON.stringify(appointmentsResult.error)}`);

    const contacts = asRows(contactsResult.data);
    const inquiries = asRows(inquiriesResult.data);
    const appointments = asRows(appointmentsResult.data);
    const now = Date.now();
    const week = 7 * 24 * 3600000;
    const currentStart = now - week;
    const previousStart = now - (2 * week);

    const createdIn = (row: Record<string, unknown>, start: number, end: number) => {
      const created = dateMs(row.createdAt);
      return created >= start && created < end;
    };

    const current = {
      new_contacts: contacts.filter(row => createdIn(row, currentStart, now)).length,
      new_inquiries: inquiries.filter(row => createdIn(row, currentStart, now)).length,
      appointments_created: appointments.filter(row => createdIn(row, currentStart, now)).length,
      appointments_completed: appointments.filter(row => createdIn(row, currentStart, now) && String(row.status).toLowerCase() === 'completed').length,
      closed_won_contacts: contacts.filter(row => String(row.status).toUpperCase() === 'CLOSED_WON').length,
      overdue_follow_ups: contacts.filter(row => dateMs(row.nextFollowUpAt) > 0 && dateMs(row.nextFollowUpAt) < now).length,
    };

    const previous = {
      new_contacts: contacts.filter(row => createdIn(row, previousStart, currentStart)).length,
      new_inquiries: inquiries.filter(row => createdIn(row, previousStart, currentStart)).length,
      appointments_created: appointments.filter(row => createdIn(row, previousStart, currentStart)).length,
      appointments_completed: appointments.filter(row => createdIn(row, previousStart, currentStart) && String(row.status).toLowerCase() === 'completed').length,
    };

    const dataSummary = [
      `Current 7 days: ${JSON.stringify(current)}`,
      `Previous 7 days: ${JSON.stringify(previous)}`,
      'Source limitation: the canonical CRM currently has no policy/premium ledger, so premium and issued-policy totals are intentionally omitted.',
    ].join('\n');

    let insights = {
      wins: [`${current.new_inquiries} new inquiries`, `${current.appointments_created} appointments created`, `${current.appointments_completed} appointments completed`],
      attention_areas: [`${current.overdue_follow_ups} overdue follow-ups`, 'Review inquiry-to-booking conversion', 'Keep CRM activity dates current'],
      next_week_action: 'Work overdue follow-ups first, then move qualified inquiries toward booked consultations.',
      mission_insight: 'Use the operating data to keep protection conversations moving consistently. #TheBeatGoesOn',
    };
    let tokensUsed = 0;

    if (env.GEMINI_API_KEY) {
      const response = await callOpenAI(env, [
        { role: 'system', content: LATIMORE_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Analyze this canonical Latimore CRM weekly data without inventing policy, premium, or carrier metrics.\n\n${dataSummary}\n\nReturn JSON with keys wins (3 strings), attention_areas (3 strings), next_week_action, mission_insight.`,
        },
      ], { json: true, temperature: 0.3, max_tokens: 500 });

      tokensUsed = response.tokens_used;
      try {
        insights = JSON.parse(response.content) as typeof insights;
      } catch {
        this.log('Using deterministic weekly insights because AI JSON parsing failed');
      }
    }

    return {
      success: true,
      data: {
        report_type: 'weekly_summary',
        source: 'canonical_prisma_crm',
        current_7_days: current,
        previous_7_days: previous,
        insights,
        policy_metrics_available: false,
        generated_at: new Date().toISOString(),
      },
      tokens_used: tokensUsed,
      actions_taken: ['fetched_canonical_contacts', 'fetched_canonical_inquiries', 'fetched_canonical_appointments', 'calculated_weekly_metrics'],
    };
  }

  private async generatePipelineHealth(db: ReturnType<typeof createDBClient>): Promise<WorkerOutput> {
    const result = await db.raw('Contact')
      .select('id,fullName,status,primarySource,nextFollowUpAt,lastActivityAt,createdAt')
      .order('createdAt', { ascending: false })
      .limit(1000)
      .execute();
    if (result.error) throw new Error(`Pipeline read failed: ${JSON.stringify(result.error)}`);

    const allContacts = asRows(result.data);
    const terminal = new Set(['CLOSED_WON', 'CLOSED_LOST', 'DORMANT']);
    const contacts = allContacts.filter(contact => !terminal.has(String(contact.status).toUpperCase()));
    const now = Date.now();
    const staleAfter = 7 * 24 * 3600000;

    const staleContacts = contacts.filter(contact => {
      const last = dateMs(contact.lastActivityAt) || dateMs(contact.createdAt);
      return last > 0 && now - last > staleAfter;
    });
    const overdue = contacts.filter(contact => {
      const due = dateMs(contact.nextFollowUpAt);
      return due > 0 && due < now;
    });
    const statusDistribution = contacts.reduce<Record<string, number>>((acc, contact) => {
      const status = String(contact.status || 'UNKNOWN');
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return {
      success: true,
      data: {
        report_type: 'pipeline_health',
        source: 'canonical_prisma_crm',
        total_active: contacts.length,
        stale_contacts: staleContacts.length,
        overdue_follow_ups: overdue.length,
        status_distribution: statusDistribution,
        health_score: calculateHealthScore(contacts.length, staleContacts.length, overdue.length),
        generated_at: new Date().toISOString(),
      },
      actions_taken: ['fetched_canonical_pipeline', 'calculated_health_score'],
    };
  }

  private async generateLeadSourceAnalysis(db: ReturnType<typeof createDBClient>): Promise<WorkerOutput> {
    const result = await db.raw('Inquiry')
      .select('id,source,medium,campaign,createdAt,status,stage,contactId')
      .order('createdAt', { ascending: false })
      .limit(1000)
      .execute();
    if (result.error) throw new Error(`Inquiry source analysis failed: ${JSON.stringify(result.error)}`);

    const inquiries = asRows(result.data);
    const convertedStatuses = new Set(['QUALIFIED', 'BOOKED', 'IN_CONSULT', 'CLOSED_WON']);
    const breakdown = inquiries.reduce<Record<string, { total: number; converted: number }>>((acc, inquiry) => {
      const source = String(inquiry.source || 'unknown');
      if (!acc[source]) acc[source] = { total: 0, converted: 0 };
      acc[source].total += 1;
      if (convertedStatuses.has(String(inquiry.status).toUpperCase())) acc[source].converted += 1;
      return acc;
    }, {});

    const sourceAnalysis = Object.entries(breakdown)
      .map(([source, data]) => ({
        source,
        total_inquiries: data.total,
        qualified_or_better: data.converted,
        conversion_rate: data.total ? Number(((data.converted / data.total) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.total_inquiries - a.total_inquiries);

    return {
      success: true,
      data: {
        report_type: 'lead_source_analysis',
        source: 'canonical_prisma_crm',
        total_inquiries: inquiries.length,
        source_breakdown: sourceAnalysis,
        top_source: sourceAnalysis[0]?.source || 'unknown',
        generated_at: new Date().toISOString(),
      },
      actions_taken: ['fetched_canonical_inquiries', 'calculated_source_breakdown'],
    };
  }

  private async generateAgencyPerformance(db: ReturnType<typeof createDBClient>): Promise<WorkerOutput> {
    const [contactsResult, inquiriesResult, appointmentsResult] = await Promise.all([
      db.raw('Contact').select('id,status').limit(2000).execute(),
      db.raw('Inquiry').select('id,status,stage').limit(2000).execute(),
      db.raw('Appointment').select('id,status').limit(2000).execute(),
    ]);
    if (contactsResult.error || inquiriesResult.error || appointmentsResult.error) {
      throw new Error(`Agency performance read failed: ${JSON.stringify(contactsResult.error || inquiriesResult.error || appointmentsResult.error)}`);
    }

    const contacts = asRows(contactsResult.data);
    const inquiries = asRows(inquiriesResult.data);
    const appointments = asRows(appointmentsResult.data);

    return {
      success: true,
      data: {
        report_type: 'agent_performance',
        source: 'canonical_prisma_crm',
        scope: 'agency',
        agent_dimension_available: false,
        total_contacts: contacts.length,
        closed_won_contacts: contacts.filter(row => String(row.status).toUpperCase() === 'CLOSED_WON').length,
        total_inquiries: inquiries.length,
        booked_or_better_inquiries: inquiries.filter(row => ['BOOKED', 'IN_CONSULT', 'CLOSED_WON'].includes(String(row.status).toUpperCase())).length,
        total_appointments: appointments.length,
        completed_appointments: appointments.filter(row => String(row.status).toLowerCase() === 'completed').length,
        note: 'No canonical Agent production/premium ledger is present, so individual-agent, premium, and annuity production figures are not fabricated.',
        generated_at: new Date().toISOString(),
      },
      actions_taken: ['calculated_canonical_agency_performance'],
    };
  }
}

function calculateHealthScore(total: number, stale: number, overdue: number): number {
  if (total === 0) return 100;
  const staleRatio = stale / total;
  const overdueRatio = overdue / total;
  return Math.max(0, Math.min(100, Math.round(100 - (staleRatio * 40) - (overdueRatio * 30))));
}
