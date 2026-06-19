/**
 * Weekly KPI Report Handler
 * Runs Monday 9am ET via cron
 * Generates weekly production summary and sends to Jackson
 */

import type { Env } from '../index';
import { createSupabaseClient } from '../lib/supabase';
import { sendEmail } from '../lib/comms';
import { jsonResponse } from '../lib/response';

export async function handleWeeklyKPI(
  request: Request | null,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  console.log('[WeeklyKPI] Generating weekly KPI report...');

  const db = createSupabaseClient(env);

  // Calculate last week's date range
  const now = new Date();
  const lastMonday = new Date(now);
  lastMonday.setDate(now.getDate() - 7);
  const lastSunday = new Date(now);
  lastSunday.setDate(now.getDate() - 1);

  const weekStart = lastMonday.toISOString().split('T')[0];
  const weekEnd = lastSunday.toISOString().split('T')[0];

  try {
    // Fetch weekly production data
    const { data: weeklyProduction } = await db.rpc('get_monthly_production', {
      p_year: lastMonday.getFullYear(),
      p_month: lastMonday.getMonth() + 1,
    });

    // Fetch new leads this week
    const { data: weekLeads } = await db
      .from('leads')
      .select('id, source, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    // Fetch appointments this week
    const { data: weekAppts } = await db
      .from('appointments')
      .select('id, status, appointment_type, scheduled_at')
      .order('scheduled_at', { ascending: false })
      .limit(50);

    // Fetch pipeline summary
    const { data: pipeline } = await db.rpc('get_pipeline_summary');

    // Fetch agent leaderboard
    const { data: leaderboard } = await db
      .from('v_agent_leaderboard')
      .select('agent_name, ytd_premium, ytd_policies, status')
      .limit(10);

    const production = weeklyProduction as {
      policies_issued: number;
      premium_written: number;
      annuity_premium: number;
      apps_submitted: number;
      commission_earned: number;
    } || {
      policies_issued: 0, premium_written: 0, annuity_premium: 0,
      apps_submitted: 0, commission_earned: 0,
    };

    const leads = weekLeads as Array<{ id: string; source: string; created_at: string }> || [];
    const appts = weekAppts as Array<{ id: string; status: string; appointment_type: string }> || [];
    const pipelineData = pipeline as Array<{ status: string; count: number }> || [];
    const agents = leaderboard as Array<{ agent_name: string; ytd_premium: number; ytd_policies: number }> || [];

    // Calculate conversion rates
    const apptHeld = appts.filter(a => a.status === 'held').length;
    const apptSet = appts.filter(a => ['scheduled', 'confirmed', 'held'].includes(a.status)).length;
    const conversionRate = apptSet > 0 ? ((production.policies_issued / apptSet) * 100).toFixed(1) : '0.0';

    // Write KPI snapshot to DB
    ctx.waitUntil(
      db.from('kpi_snapshots').upsert({
        snapshot_date: weekStart,
        period_type: 'weekly',
        agent_id: null,
        new_leads: leads.length,
        appointments_set: apptSet,
        appointments_held: apptHeld,
        apps_submitted: production.apps_submitted,
        policies_issued: production.policies_issued,
        premium_written: production.premium_written,
        annuity_premium: production.annuity_premium,
        commission_earned: production.commission_earned,
      })
    );

    // Build and send report
    const reportHtml = buildWeeklyKPIEmail({
      weekStart,
      weekEnd,
      production,
      leads,
      appts,
      pipeline: pipelineData,
      agents,
      conversionRate,
    });

    await sendEmail(env, {
      to: 'Jackson1989@latimorelegacy.com',
      subject: `📊 Weekly KPI Report — Week of ${weekStart} | ${leads.length} leads, ${production.policies_issued} policies`,
      html: reportHtml,
      tags: [{ name: 'type', value: 'weekly_kpi' }],
    });

    console.log(`[WeeklyKPI] Report sent for week ${weekStart}–${weekEnd}`);

    if (request) {
      return jsonResponse({ success: true, week_start: weekStart, week_end: weekEnd });
    }
    return jsonResponse({ success: true });

  } catch (err) {
    console.error('[WeeklyKPI] Error:', err);
    if (request) return jsonResponse({ success: false, error: String(err) }, 500);
    return jsonResponse({ success: false });
  }
}

function buildWeeklyKPIEmail(data: {
  weekStart: string;
  weekEnd: string;
  production: { policies_issued: number; premium_written: number; annuity_premium: number; apps_submitted: number; commission_earned: number };
  leads: Array<{ id: string; source: string }>;
  appts: Array<{ id: string; status: string }>;
  pipeline: Array<{ status: string; count: number }>;
  agents: Array<{ agent_name: string; ytd_premium: number; ytd_policies: number }>;
  conversionRate: string;
}): string {
  const sourceBreakdown = data.leads.reduce((acc, l) => {
    acc[l.source] = (acc[l.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sourceRows = Object.entries(sourceBreakdown)
    .sort(([, a], [, b]) => b - a)
    .map(([source, count]) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-transform:capitalize;">${source}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-weight:bold;color:#1B3A6B;">${count}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#888;">${((count / data.leads.length) * 100).toFixed(0)}%</td>
      </tr>`).join('');

  const agentRows = data.agents.length > 0
    ? data.agents.map((a, i) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${i + 1}. ${a.agent_name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-weight:bold;color:#C8A951;">$${(a.ytd_premium || 0).toLocaleString()}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${a.ytd_policies || 0}</td>
        </tr>`).join('')
    : '<tr><td colspan="3" style="padding:12px;color:#888;text-align:center;">No agent data yet</td></tr>';

  const pipelineRows = data.pipeline.map(p => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-transform:capitalize;">${p.status.replace(/_/g, ' ')}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-weight:bold;color:#1B3A6B;">${p.count}</td>
    </tr>`).join('');

  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:30px 20px;">
    <tr><td align="center">
      <table width="680" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;">

        <!-- Header -->
        <tr><td style="background:#1B3A6B;padding:28px 36px;">
          <h1 style="color:#C8A951;font-size:22px;margin:0;">📊 Weekly KPI Report — Latimore OS</h1>
          <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:6px 0 0;">Week of ${data.weekStart} → ${data.weekEnd}</p>
        </td></tr>

        <!-- Production KPIs -->
        <tr><td style="padding:28px 36px 0;">
          <h3 style="color:#1B3A6B;margin:0 0 16px;font-size:16px;border-bottom:2px solid #C8A951;padding-bottom:8px;">💼 Personal Production</h3>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              ${[
                ['Policies Issued', data.production.policies_issued, '#276221'],
                ['Premium Written', `$${(data.production.premium_written || 0).toLocaleString()}`, '#1B3A6B'],
                ['Annuity Premium', `$${(data.production.annuity_premium || 0).toLocaleString()}`, '#C8A951'],
                ['Apps Submitted', data.production.apps_submitted, '#555'],
                ['Commission', `$${(data.production.commission_earned || 0).toLocaleString()}`, '#276221'],
              ].map(([label, value, color]) => `
                <td style="text-align:center;padding:16px 8px;background:#f8f8f8;border-radius:8px;margin:4px;">
                  <div style="font-size:24px;font-weight:bold;color:${color};">${value}</div>
                  <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-top:4px;">${label}</div>
                </td>`).join('<td style="width:8px;"></td>')}
            </tr>
          </table>
        </td></tr>

        <!-- Lead Activity -->
        <tr><td style="padding:24px 36px 0;">
          <h3 style="color:#1B3A6B;margin:0 0 16px;font-size:16px;border-bottom:2px solid #C8A951;padding-bottom:8px;">🔔 Lead Activity</h3>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              ${[
                ['Total Leads', data.leads.length, '#1B3A6B'],
                ['Appts Set', data.appts.filter(a => ['scheduled','confirmed','held'].includes(a.status)).length, '#C8A951'],
                ['Appts Held', data.appts.filter(a => a.status === 'held').length, '#276221'],
                ['Conversion', `${data.conversionRate}%`, '#9C5700'],
              ].map(([label, value, color]) => `
                <td style="text-align:center;padding:16px 8px;background:#f8f8f8;border-radius:8px;">
                  <div style="font-size:24px;font-weight:bold;color:${color};">${value}</div>
                  <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-top:4px;">${label}</div>
                </td>`).join('<td style="width:8px;"></td>')}
            </tr>
          </table>
        </td></tr>

        <!-- Lead Sources -->
        <tr><td style="padding:24px 36px 0;">
          <h3 style="color:#1B3A6B;margin:0 0 12px;font-size:16px;border-bottom:2px solid #C8A951;padding-bottom:8px;">📡 Lead Sources</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e0e0e0;border-radius:6px;overflow:hidden;">
            <tr style="background:#f5f5f5;">
              <th style="padding:8px 12px;text-align:left;font-size:12px;color:#555;text-transform:uppercase;">Source</th>
              <th style="padding:8px 12px;text-align:left;font-size:12px;color:#555;text-transform:uppercase;">Leads</th>
              <th style="padding:8px 12px;text-align:left;font-size:12px;color:#555;text-transform:uppercase;">Share</th>
            </tr>
            ${sourceRows || '<tr><td colspan="3" style="padding:12px;color:#888;text-align:center;">No leads this week</td></tr>'}
          </table>
        </td></tr>

        <!-- Pipeline -->
        <tr><td style="padding:24px 36px 0;">
          <h3 style="color:#1B3A6B;margin:0 0 12px;font-size:16px;border-bottom:2px solid #C8A951;padding-bottom:8px;">🔄 Pipeline Status</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e0e0e0;border-radius:6px;overflow:hidden;">
            <tr style="background:#f5f5f5;">
              <th style="padding:8px 12px;text-align:left;font-size:12px;color:#555;text-transform:uppercase;">Status</th>
              <th style="padding:8px 12px;text-align:left;font-size:12px;color:#555;text-transform:uppercase;">Count</th>
            </tr>
            ${pipelineRows || '<tr><td colspan="2" style="padding:12px;color:#888;text-align:center;">No pipeline data</td></tr>'}
          </table>
        </td></tr>

        <!-- Agent Leaderboard -->
        <tr><td style="padding:24px 36px;">
          <h3 style="color:#1B3A6B;margin:0 0 12px;font-size:16px;border-bottom:2px solid #C8A951;padding-bottom:8px;">🏆 Agent Leaderboard (YTD)</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e0e0e0;border-radius:6px;overflow:hidden;">
            <tr style="background:#f5f5f5;">
              <th style="padding:8px 12px;text-align:left;font-size:12px;color:#555;text-transform:uppercase;">Agent</th>
              <th style="padding:8px 12px;text-align:left;font-size:12px;color:#555;text-transform:uppercase;">YTD Premium</th>
              <th style="padding:8px 12px;text-align:left;font-size:12px;color:#555;text-transform:uppercase;">Policies</th>
            </tr>
            ${agentRows}
          </table>

          <div style="text-align:center;margin-top:24px;">
            <a href="https://hub.latimorelifelegacy.com/admin/dashboard" style="display:inline-block;background:#1B3A6B;color:#C8A951;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:15px;">
              Open Full Dashboard →
            </a>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f0f0f0;padding:16px 36px;text-align:center;border-top:1px solid #e0e0e0;">
          <p style="color:#888;font-size:12px;margin:0;">Protecting Today. Securing Tomorrow. #TheBeatGoesOn<br>
          Latimore Life & Legacy LLC | PA DOI #1268820</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}