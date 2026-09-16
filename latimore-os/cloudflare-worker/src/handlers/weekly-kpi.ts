/**
 * Weekly KPI Report Handler
 * Runs Monday 9am ET via cron.
 * Uses canonical Contact, Inquiry, Appointment, and WeeklyReport records only.
 */

import type { Env } from '../index';
import { createSupabaseClient } from '../lib/supabase';
import { sendEmail } from '../lib/comms';
import { jsonResponse } from '../lib/response';

export async function handleWeeklyKPI(
  request: Request | null,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  console.log('[WeeklyKPI] Generating canonical weekly KPI report...');
  const db = createSupabaseClient(env);

  const now = new Date();
  const weekEndDate = new Date(now);
  weekEndDate.setDate(now.getDate() - 1);
  weekEndDate.setHours(23, 59, 59, 999);
  const weekStartDate = new Date(weekEndDate);
  weekStartDate.setDate(weekEndDate.getDate() - 6);
  weekStartDate.setHours(0, 0, 0, 0);

  const weekStart = weekStartDate.toISOString().slice(0, 10);
  const weekEnd = weekEndDate.toISOString().slice(0, 10);

  try {
    const [inquiryResult, appointmentResult, contactResult] = await Promise.all([
      db.from('Inquiry').select('id,source,status,stage,createdAt').order('createdAt', { ascending: false }).limit(1000).execute(),
      db.from('Appointment').select('id,status,scheduledFor,createdAt').order('createdAt', { ascending: false }).limit(1000).execute(),
      db.from('Contact').select('id,status,createdAt,nextFollowUpAt,lastActivityAt').limit(2000).execute(),
    ]);

    if (inquiryResult.error) throw new Error(`Inquiry read failed: ${inquiryResult.error.message}`);
    if (appointmentResult.error) throw new Error(`Appointment read failed: ${appointmentResult.error.message}`);
    if (contactResult.error) throw new Error(`Contact read failed: ${contactResult.error.message}`);

    const inquiries = (Array.isArray(inquiryResult.data) ? inquiryResult.data : []) as Array<{ id: string; source?: string | null; status: string; stage: string; createdAt: string }>;
    const appointments = (Array.isArray(appointmentResult.data) ? appointmentResult.data : []) as Array<{ id: string; status: string; scheduledFor?: string | null; createdAt: string }>;
    const contacts = (Array.isArray(contactResult.data) ? contactResult.data : []) as Array<{ id: string; status: string; createdAt: string; nextFollowUpAt?: string | null; lastActivityAt?: string | null }>;

    const startMs = weekStartDate.getTime();
    const endMs = weekEndDate.getTime();
    const inRange = (value?: string | null) => {
      if (!value) return false;
      const ms = new Date(value).getTime();
      return ms >= startMs && ms <= endMs;
    };

    const weeklyInquiries = inquiries.filter(item => inRange(item.createdAt));
    const weeklyAppointments = appointments.filter(item => inRange(item.createdAt) || inRange(item.scheduledFor));
    const appointmentsSet = weeklyAppointments.filter(item => !['cancelled', 'canceled'].includes(String(item.status).toLowerCase())).length;
    const appointmentsHeld = weeklyAppointments.filter(item => ['completed', 'held'].includes(String(item.status).toLowerCase())).length;
    const bookedOrBetter = weeklyInquiries.filter(item => ['BOOKED', 'IN_CONSULT', 'CLOSED_WON'].includes(String(item.status).toUpperCase())).length;
    const conversionRate = weeklyInquiries.length ? Number(((bookedOrBetter / weeklyInquiries.length) * 100).toFixed(1)) : 0;

    const sourceBreakdown = weeklyInquiries.reduce<Record<string, number>>((acc, inquiry) => {
      const source = inquiry.source || 'unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});

    const pipelineMap = contacts.reduce<Record<string, number>>((acc, contact) => {
      const status = String(contact.status || 'UNKNOWN');
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    const pipeline = Object.entries(pipelineMap).map(([status, count]) => ({ status, count }));

    const overdueFollowUps = contacts.filter(contact => {
      if (!contact.nextFollowUpAt) return false;
      return new Date(contact.nextFollowUpAt).getTime() < Date.now();
    }).length;

    const kpis = {
      new_inquiries: weeklyInquiries.length,
      appointments_set: appointmentsSet,
      appointments_held: appointmentsHeld,
      booked_or_better_inquiries: bookedOrBetter,
      inquiry_to_booked_rate: conversionRate,
      overdue_follow_ups: overdueFollowUps,
      source_breakdown: sourceBreakdown,
      pipeline,
      policy_metrics_available: false,
    };

    const existing = await db.from('WeeklyReport')
      .select('id')
      .eq('weekStart', weekStartDate.toISOString())
      .eq('weekEnd', weekEndDate.toISOString())
      .single();
    if (existing.error) throw new Error(`WeeklyReport lookup failed: ${existing.error.message}`);

    const reportPayload = {
      weekStart: weekStartDate.toISOString(),
      weekEnd: weekEndDate.toISOString(),
      kpis,
      insights: {
        source: 'canonical_prisma_crm',
        note: 'Policy, premium, commission, and individual-agent production metrics are omitted because the canonical CRM currently has no production ledger.',
      },
      opportunities: {
        overdue_follow_ups: overdueFollowUps,
        booked_or_better_inquiries: bookedOrBetter,
      },
      recommendations: {
        next_action: 'Work overdue follow-ups first, then move qualified inquiries toward booked consultations.',
      },
    };

    if (existing.data) {
      const updated = await db.from('WeeklyReport').update(reportPayload).eq('id', (existing.data as { id: string }).id).execute();
      if (updated.error) throw new Error(`WeeklyReport update failed: ${updated.error.message}`);
    } else {
      const created = await db.from('WeeklyReport').insert(reportPayload);
      if (created.error) throw new Error(`WeeklyReport create failed: ${created.error.message}`);
    }

    await sendEmail(env, {
      to: 'Jackson1989@latimorelegacy.com',
      subject: `📊 Weekly KPI Report — ${weekStart} to ${weekEnd} | ${weeklyInquiries.length} inquiries`,
      html: buildWeeklyKPIEmail({
        weekStart,
        weekEnd,
        inquiries: weeklyInquiries.length,
        appointmentsSet,
        appointmentsHeld,
        bookedOrBetter,
        conversionRate,
        overdueFollowUps,
        sourceBreakdown,
        pipeline,
      }),
      tags: [{ name: 'type', value: 'weekly_kpi' }],
    });

    ctx.waitUntil(env.WORKFLOW_QUEUE.send({
      workflow: 'weekly-kpi-report',
      trigger: 'scheduled',
      payload: { week_start: weekStart, week_end: weekEnd },
    }));

    console.log(`[WeeklyKPI] Canonical report sent for ${weekStart}–${weekEnd}`);
    return request ? jsonResponse({ success: true, week_start: weekStart, week_end: weekEnd }) : jsonResponse({ success: true });
  } catch (err) {
    console.error('[WeeklyKPI] Error:', err);
    if (request) return jsonResponse({ success: false, error: String(err) }, 500);
    return jsonResponse({ success: false });
  }
}

function buildWeeklyKPIEmail(data: {
  weekStart: string;
  weekEnd: string;
  inquiries: number;
  appointmentsSet: number;
  appointmentsHeld: number;
  bookedOrBetter: number;
  conversionRate: number;
  overdueFollowUps: number;
  sourceBreakdown: Record<string, number>;
  pipeline: Array<{ status: string; count: number }>;
}): string {
  const sourceRows = Object.entries(data.sourceBreakdown)
    .sort(([, a], [, b]) => b - a)
    .map(([source, count]) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;text-transform:capitalize;">${source}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:bold;">${count}</td></tr>`)
    .join('') || '<tr><td colspan="2" style="padding:12px;color:#888;text-align:center;">No inquiries this week</td></tr>';

  const pipelineRows = data.pipeline
    .map(item => `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;">${item.status.replace(/_/g, ' ')}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:bold;">${item.count}</td></tr>`)
    .join('');

  const cards = [
    ['New Inquiries', data.inquiries],
    ['Appointments Set', data.appointmentsSet],
    ['Appointments Held', data.appointmentsHeld],
    ['Booked or Better', data.bookedOrBetter],
    ['Inquiry → Booked', `${data.conversionRate}%`],
    ['Overdue Follow-ups', data.overdueFollowUps],
  ];

  return `<!DOCTYPE html><html><body style="margin:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 20px;"><tr><td align="center">
    <table width="680" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;">
      <tr><td style="background:#0E1A2B;padding:28px 36px;"><h1 style="color:#C9A25F;font-size:22px;margin:0;">📊 Weekly KPI Report — Latimore OS</h1><p style="color:rgba(255,255,255,.7);margin:6px 0 0;">${data.weekStart} → ${data.weekEnd}</p></td></tr>
      <tr><td style="padding:28px 36px;">
        <table width="100%" cellpadding="0" cellspacing="8"><tr>${cards.slice(0,3).map(([label,value]) => `<td style="text-align:center;padding:16px;background:#f8f8f8;border-radius:8px;"><div style="font-size:24px;font-weight:bold;color:#0E1A2B;">${value}</div><div style="font-size:11px;color:#888;text-transform:uppercase;">${label}</div></td>`).join('')}</tr><tr>${cards.slice(3).map(([label,value]) => `<td style="text-align:center;padding:16px;background:#f8f8f8;border-radius:8px;"><div style="font-size:24px;font-weight:bold;color:#C9A25F;">${value}</div><div style="font-size:11px;color:#888;text-transform:uppercase;">${label}</div></td>`).join('')}</tr></table>
        <h3 style="color:#0E1A2B;border-bottom:2px solid #C9A25F;padding-bottom:8px;">Lead Sources</h3><table width="100%">${sourceRows}</table>
        <h3 style="color:#0E1A2B;border-bottom:2px solid #C9A25F;padding-bottom:8px;margin-top:24px;">Pipeline</h3><table width="100%">${pipelineRows || '<tr><td style="padding:12px;color:#888;">No pipeline data</td></tr>'}</table>
        <div style="margin-top:24px;padding:16px;background:#f8f6f0;border-left:4px solid #C9A25F;"><strong>Data scope:</strong> canonical CRM activity only. Policy, premium, commission, and individual-agent production figures are not shown until a canonical production ledger exists.</div>
        <div style="text-align:center;margin-top:24px;"><a href="https://hub.latimorelifelegacy.com/admin/master-dashboard" style="display:inline-block;background:#0E1A2B;color:#C9A25F;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold;">Open Latimore OS →</a></div>
      </td></tr>
      <tr><td style="background:#f0f0f0;padding:16px 36px;text-align:center;"><p style="color:#888;font-size:12px;margin:0;">Protecting Today. Securing Tomorrow. #TheBeatGoesOn | PA DOI #1268820</p></td></tr>
    </table>
  </td></tr></table></body></html>`;
}
