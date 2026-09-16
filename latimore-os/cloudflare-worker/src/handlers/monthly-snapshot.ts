/**
 * Monthly Snapshot Handler
 * Runs on the 1st of the month and summarizes the previous calendar month
 * from the canonical Prisma-managed Latimore CRM.
 */

import type { Env } from '../index';
import { createSupabaseClient } from '../lib/supabase';
import { sendEmail } from '../lib/comms';
import { jsonResponse } from '../lib/response';

export async function handleMonthlySnapshot(
  request: Request | null,
  env: Env,
  _ctx: ExecutionContext,
): Promise<Response> {
  console.log('[MonthlySnapshot] Generating canonical monthly snapshot...');
  const db = createSupabaseClient(env);

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 0, 0, 0, 0));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const monthName = monthStart.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

  try {
    const [inquiryResult, appointmentResult, contactResult] = await Promise.all([
      db.from('Inquiry').select('id,status,stage,source,createdAt').order('createdAt', { ascending: false }).limit(5000).execute(),
      db.from('Appointment').select('id,status,createdAt,scheduledFor').order('createdAt', { ascending: false }).limit(5000).execute(),
      db.from('Contact').select('id,status,createdAt,nextFollowUpAt,lastActivityAt').limit(5000).execute(),
    ]);

    if (inquiryResult.error) throw new Error(`Inquiry read failed: ${inquiryResult.error.message}`);
    if (appointmentResult.error) throw new Error(`Appointment read failed: ${appointmentResult.error.message}`);
    if (contactResult.error) throw new Error(`Contact read failed: ${contactResult.error.message}`);

    const inquiries = (Array.isArray(inquiryResult.data) ? inquiryResult.data : []) as Array<{ id: string; status: string; stage: string; source?: string | null; createdAt: string }>;
    const appointments = (Array.isArray(appointmentResult.data) ? appointmentResult.data : []) as Array<{ id: string; status: string; createdAt: string; scheduledFor?: string | null }>;
    const contacts = (Array.isArray(contactResult.data) ? contactResult.data : []) as Array<{ id: string; status: string; createdAt: string; nextFollowUpAt?: string | null; lastActivityAt?: string | null }>;

    const startMs = monthStart.getTime();
    const endMs = monthEnd.getTime();
    const inMonth = (value?: string | null) => {
      if (!value) return false;
      const ms = new Date(value).getTime();
      return ms >= startMs && ms < endMs;
    };

    const monthInquiries = inquiries.filter(row => inMonth(row.createdAt));
    const monthAppointments = appointments.filter(row => inMonth(row.createdAt) || inMonth(row.scheduledFor));
    const monthContacts = contacts.filter(row => inMonth(row.createdAt));
    const appointmentsSet = monthAppointments.filter(row => !['cancelled', 'canceled'].includes(String(row.status).toLowerCase())).length;
    const appointmentsHeld = monthAppointments.filter(row => ['completed', 'held'].includes(String(row.status).toLowerCase())).length;
    const closedWon = contacts.filter(row => String(row.status).toUpperCase() === 'CLOSED_WON' && inMonth(row.lastActivityAt || row.createdAt)).length;
    const overdueFollowUps = contacts.filter(row => row.nextFollowUpAt && new Date(row.nextFollowUpAt).getTime() < Date.now()).length;

    const sourceBreakdown = monthInquiries.reduce<Record<string, number>>((acc, inquiry) => {
      const source = inquiry.source || 'unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});

    const metrics = {
      month: monthStart.toISOString().slice(0, 7),
      new_contacts: monthContacts.length,
      new_inquiries: monthInquiries.length,
      appointments_set: appointmentsSet,
      appointments_held: appointmentsHeld,
      closed_won_contacts: closedWon,
      overdue_follow_ups: overdueFollowUps,
      source_breakdown: sourceBreakdown,
      policy_metrics_available: false,
      production_ledger_available: false,
    };

    const event = await db.from('SystemEvent').insert({
      type: 'analytics.monthly_snapshot',
      source: 'latimore_os_cron',
      payload: metrics,
      metadata: {
        period_start: monthStart.toISOString(),
        period_end: monthEnd.toISOString(),
        data_source: 'canonical_prisma_crm',
      },
      occurredAt: new Date().toISOString(),
    });
    if (event.error) throw new Error(`Monthly snapshot event failed: ${event.error.message}`);

    await sendEmail(env, {
      to: 'Jackson1989@latimorelegacy.com',
      subject: `📈 Monthly Snapshot — ${monthName} | ${monthInquiries.length} inquiries`,
      html: buildMonthlySnapshotEmail(monthName, metrics),
      tags: [{ name: 'type', value: 'monthly_snapshot' }],
    });

    console.log(`[MonthlySnapshot] Canonical snapshot written for ${metrics.month}`);
    if (request) return jsonResponse({ success: true, month: metrics.month, metrics });
    return jsonResponse({ success: true });
  } catch (err) {
    console.error('[MonthlySnapshot] Error:', err);
    if (request) return jsonResponse({ success: false, error: String(err) }, 500);
    return jsonResponse({ success: false });
  }
}

function buildMonthlySnapshotEmail(
  monthName: string,
  metrics: {
    new_contacts: number;
    new_inquiries: number;
    appointments_set: number;
    appointments_held: number;
    closed_won_contacts: number;
    overdue_follow_ups: number;
    source_breakdown: Record<string, number>;
    policy_metrics_available: boolean;
    production_ledger_available: boolean;
  },
): string {
  const cards = [
    ['New Contacts', metrics.new_contacts],
    ['New Inquiries', metrics.new_inquiries],
    ['Appointments Set', metrics.appointments_set],
    ['Appointments Held', metrics.appointments_held],
    ['Closed Won', metrics.closed_won_contacts],
    ['Overdue Follow-ups', metrics.overdue_follow_ups],
  ];

  const sourceRows = Object.entries(metrics.source_breakdown)
    .sort(([, a], [, b]) => b - a)
    .map(([source, count]) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;text-transform:capitalize;">${source}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:bold;">${count}</td></tr>`)
    .join('') || '<tr><td colspan="2" style="padding:12px;color:#888;text-align:center;">No inquiries recorded</td></tr>';

  return `<!DOCTYPE html><html><body style="margin:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 20px;"><tr><td align="center">
    <table width="660" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;">
      <tr><td style="background:#0E1A2B;padding:28px 36px;"><h1 style="color:#C9A25F;font-size:22px;margin:0;">📈 Monthly Snapshot — ${monthName}</h1><p style="color:rgba(255,255,255,.72);margin:6px 0 0;">Latimore Life & Legacy · Canonical CRM Activity</p></td></tr>
      <tr><td style="padding:28px 36px;">
        <table width="100%" cellpadding="0" cellspacing="8"><tr>${cards.slice(0,3).map(([label,value]) => `<td style="text-align:center;padding:16px;background:#f8f8f8;border-radius:8px;"><div style="font-size:24px;font-weight:bold;color:#0E1A2B;">${value}</div><div style="font-size:11px;color:#888;text-transform:uppercase;">${label}</div></td>`).join('')}</tr><tr>${cards.slice(3).map(([label,value]) => `<td style="text-align:center;padding:16px;background:#f8f8f8;border-radius:8px;"><div style="font-size:24px;font-weight:bold;color:#C9A25F;">${value}</div><div style="font-size:11px;color:#888;text-transform:uppercase;">${label}</div></td>`).join('')}</tr></table>
        <h3 style="color:#0E1A2B;border-bottom:2px solid #C9A25F;padding-bottom:8px;margin-top:24px;">Inquiry Sources</h3><table width="100%">${sourceRows}</table>
        <div style="margin-top:24px;padding:16px;background:#f8f6f0;border-left:4px solid #C9A25F;line-height:1.5;"><strong>Data scope:</strong> this snapshot reports canonical CRM activity. Policy count, written premium, annuity premium, commission, and agent-production figures are intentionally omitted until those records exist in the canonical production ledger.</div>
        <div style="text-align:center;margin-top:24px;"><a href="https://hub.latimorelifelegacy.com/admin/master-dashboard" style="display:inline-block;background:#0E1A2B;color:#C9A25F;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold;">Open Latimore OS →</a></div>
      </td></tr>
      <tr><td style="background:#f0f0f0;padding:16px 36px;text-align:center;"><p style="color:#888;font-size:12px;margin:0;">Protecting Today. Securing Tomorrow. #TheBeatGoesOn | PA DOI #1268820</p></td></tr>
    </table>
  </td></tr></table></body></html>`;
}
