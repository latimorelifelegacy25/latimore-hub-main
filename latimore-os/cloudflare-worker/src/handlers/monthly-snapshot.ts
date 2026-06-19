/**
 * Monthly Snapshot Handler
 * Runs 1st of month at midnight via cron
 * Writes monthly KPI snapshot to DB
 */

import type { Env } from '../index';
import { createSupabaseClient } from '../lib/supabase';
import { sendEmail } from '../lib/comms';
import { jsonResponse } from '../lib/response';

export async function handleMonthlySnapshot(
  request: Request | null,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  console.log('[MonthlySnapshot] Generating monthly snapshot...');

  const db = createSupabaseClient(env);

  // Last month
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const year = lastMonth.getFullYear();
  const month = lastMonth.getMonth() + 1;
  const snapshotDate = `${year}-${String(month).padStart(2, '0')}-01`;

  try {
    // Get monthly production
    const { data: production } = await db.rpc('get_monthly_production', {
      p_year: year,
      p_month: month,
    });

    const prod = production as {
      policies_issued: number;
      premium_written: number;
      annuity_premium: number;
      apps_submitted: number;
      commission_earned: number;
    } || { policies_issued: 0, premium_written: 0, annuity_premium: 0, apps_submitted: 0, commission_earned: 0 };

    // Get lead counts for the month
    const { data: leads } = await db
      .from('leads')
      .select('id, source')
      .limit(500);

    const leadCount = Array.isArray(leads) ? leads.length : 0;

    // Get appointment counts
    const { data: appts } = await db
      .from('appointments')
      .select('id, status')
      .limit(200);

    const apptList = Array.isArray(appts) ? appts as Array<{ id: string; status: string }> : [];
    const apptsSet = apptList.filter(a => ['scheduled','confirmed','held','no_show'].includes(a.status)).length;
    const apptsHeld = apptList.filter(a => a.status === 'held').length;

    // Get agent counts
    const { data: agents } = await db
      .from('agents')
      .select('id, status')
      .limit(50);

    const agentList = Array.isArray(agents) ? agents as Array<{ id: string; status: string }> : [];
    const activeAgents = agentList.filter(a => a.status === 'active').length;

    // Write snapshot
    await db.from('kpi_snapshots').upsert({
      snapshot_date: snapshotDate,
      period_type: 'monthly',
      agent_id: null,
      new_leads: leadCount,
      appointments_set: apptsSet,
      appointments_held: apptsHeld,
      apps_submitted: prod.apps_submitted,
      policies_issued: prod.policies_issued,
      premium_written: prod.premium_written,
      annuity_premium: prod.annuity_premium,
      commission_earned: prod.commission_earned,
      active_agents: activeAgents,
    });

    // Send monthly summary email
    const monthName = lastMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    await sendEmail(env, {
      to: 'Jackson1989@latimorelegacy.com',
      subject: `📈 Monthly Snapshot — ${monthName} | $${(prod.premium_written || 0).toLocaleString()} premium`,
      html: buildMonthlySnapshotEmail(monthName, prod, leadCount, apptsSet, apptsHeld, activeAgents),
      tags: [{ name: 'type', value: 'monthly_snapshot' }],
    });

    console.log(`[MonthlySnapshot] Snapshot written for ${snapshotDate}`);

    if (request) return jsonResponse({ success: true, snapshot_date: snapshotDate });
    return jsonResponse({ success: true });

  } catch (err) {
    console.error('[MonthlySnapshot] Error:', err);
    if (request) return jsonResponse({ success: false, error: String(err) }, 500);
    return jsonResponse({ success: false });
  }
}

function buildMonthlySnapshotEmail(
  monthName: string,
  prod: { policies_issued: number; premium_written: number; annuity_premium: number; apps_submitted: number; commission_earned: number },
  leads: number,
  apptsSet: number,
  apptsHeld: number,
  activeAgents: number
): string {
  const metrics = [
    { label: 'New Leads', value: leads, color: '#1B3A6B' },
    { label: 'Appts Set', value: apptsSet, color: '#C8A951' },
    { label: 'Appts Held', value: apptsHeld, color: '#276221' },
    { label: 'Apps Submitted', value: prod.apps_submitted, color: '#555' },
    { label: 'Policies Issued', value: prod.policies_issued, color: '#276221' },
    { label: 'Premium Written', value: `$${(prod.premium_written || 0).toLocaleString()}`, color: '#1B3A6B' },
    { label: 'Annuity Premium', value: `$${(prod.annuity_premium || 0).toLocaleString()}`, color: '#C8A951' },
    { label: 'Commission', value: `$${(prod.commission_earned || 0).toLocaleString()}`, color: '#276221' },
    { label: 'Active Agents', value: activeAgents, color: '#9C5700' },
  ];

  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:30px 20px;">
    <tr><td align="center">
      <table width="640" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;">
        <tr><td style="background:#1B3A6B;padding:28px 36px;">
          <h1 style="color:#C8A951;font-size:22px;margin:0;">📈 Monthly Snapshot — ${monthName}</h1>
          <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:6px 0 0;">Latimore Life & Legacy — Protecting Today. Securing Tomorrow.</p>
        </td></tr>
        <tr><td style="padding:32px 36px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            ${metrics.map((m, i) => i % 3 === 0 ? `
              <tr>
                ${metrics.slice(i, i + 3).map(metric => `
                  <td style="text-align:center;padding:16px 8px;background:#f8f8f8;border-radius:8px;">
                    <div style="font-size:22px;font-weight:bold;color:${metric.color};">${metric.value}</div>
                    <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-top:4px;">${metric.label}</div>
                  </td>
                  <td style="width:8px;"></td>`).join('')}
              </tr>
              <tr><td colspan="6" style="height:12px;"></td></tr>` : '').filter(Boolean).join('')}
          </table>
          <div style="text-align:center;margin-top:24px;">
            <a href="https://hub.latimorelifelegacy.com/admin/dashboard" style="display:inline-block;background:#1B3A6B;color:#C8A951;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold;">
              View Full Dashboard →
            </a>
          </div>
        </td></tr>
        <tr><td style="background:#f0f0f0;padding:16px 36px;text-align:center;border-top:1px solid #e0e0e0;">
          <p style="color:#888;font-size:12px;margin:0;">Protecting Today. Securing Tomorrow. #TheBeatGoesOn | PA DOI #1268820</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}