/**
 * Daily Brief Handler
 * Runs at 8am ET every day via cron
 * Sends Jackson a daily summary of pipeline, tasks, and appointments
 */

import type { Env } from '../index';
import { createSupabaseClient } from '../lib/supabase';
import { sendEmail, sendSMS } from '../lib/comms';
import { jsonResponse } from '../lib/response';

export async function handleDailyBrief(
  request: Request | null,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  console.log('[DailyBrief] Starting daily brief generation...');

  const db = createSupabaseClient(env);
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  try {
    // Fetch today's appointments
    const { data: appointments } = await db
      .from('appointments')
      .select('id, appointment_type, scheduled_at, status')
      .eq('status', 'scheduled')
      .order('scheduled_at', { ascending: true })
      .limit(20);

    // Fetch overdue tasks
    const { data: overdueTasks } = await db
      .from('tasks')
      .select('id, title, priority, due_at, contact_id')
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .limit(10);

    // Fetch new leads (last 24h)
    const { data: newLeads } = await db
      .from('leads')
      .select('id, first_name, last_name, source, created_at')
      .eq('is_processed', false)
      .order('created_at', { ascending: false })
      .limit(20);

    // Fetch pipeline summary
    const { data: pipeline } = await db.rpc('get_pipeline_summary');

    const apptList = (appointments as Array<{
      id: string;
      appointment_type: string;
      scheduled_at: string;
      status: string;
    }> || []).filter(a => {
      const apptDate = a.scheduled_at.split('T')[0];
      return apptDate === today || apptDate === tomorrow;
    });

    const taskList = overdueTasks as Array<{
      id: string;
      title: string;
      priority: string;
      due_at: string;
    }> || [];

    const leadList = newLeads as Array<{
      id: string;
      first_name: string;
      last_name: string;
      source: string;
      created_at: string;
    }> || [];

    // Build brief email
    const briefHtml = buildDailyBriefEmail({
      date: new Date().toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
        timeZone: 'America/New_York',
      }),
      appointments: apptList,
      overdueTasks: taskList,
      newLeads: leadList,
      pipeline: pipeline as Array<{ status: string; count: number }> || [],
    });

    // Send email brief
    await sendEmail(env, {
      to: 'Jackson1989@latimorelegacy.com',
      subject: `☀️ Daily Brief — ${today} | ${apptList.length} appts, ${leadList.length} new leads`,
      html: briefHtml,
      tags: [{ name: 'type', value: 'daily_brief' }],
    });

    // Send SMS summary
    const smsBody = buildDailyBriefSMS(apptList.length, leadList.length, taskList.length);
    await sendSMS(env, {
      to: env.TWILIO_PHONE_NUMBER,
      body: smsBody,
    });

    console.log(`[DailyBrief] Sent: ${apptList.length} appts, ${leadList.length} leads, ${taskList.length} tasks`);

    if (request) {
      return jsonResponse({
        success: true,
        appointments: apptList.length,
        new_leads: leadList.length,
        overdue_tasks: taskList.length,
      });
    }
    return jsonResponse({ success: true });

  } catch (err) {
    console.error('[DailyBrief] Error:', err);
    if (request) return jsonResponse({ success: false, error: String(err) }, 500);
    return jsonResponse({ success: false });
  }
}

function buildDailyBriefSMS(appts: number, leads: number, tasks: number): string {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/New_York' });
  return `☀️ Daily Brief ${today}: ${appts} appt${appts !== 1 ? 's' : ''} today, ${leads} new lead${leads !== 1 ? 's' : ''}, ${tasks} task${tasks !== 1 ? 's' : ''} pending. Hub: hub.latimorelifelegacy.com #TheBeatGoesOn`;
}

function buildDailyBriefEmail(data: {
  date: string;
  appointments: Array<{ id: string; appointment_type: string; scheduled_at: string; status: string }>;
  overdueTasks: Array<{ id: string; title: string; priority: string; due_at: string }>;
  newLeads: Array<{ id: string; first_name: string; last_name: string; source: string; created_at: string }>;
  pipeline: Array<{ status: string; count: number }>;
}): string {
  const apptRows = data.appointments.length > 0
    ? data.appointments.map(a => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${formatTime(a.scheduled_at)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${a.appointment_type.replace(/_/g, ' ')}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#276221;">${a.status}</td>
        </tr>`).join('')
    : '<tr><td colspan="3" style="padding:12px;color:#888;text-align:center;">No appointments today</td></tr>';

  const leadRows = data.newLeads.length > 0
    ? data.newLeads.slice(0, 5).map(l => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${l.first_name} ${l.last_name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#C8A951;">${l.source}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#888;">${formatRelativeTime(l.created_at)}</td>
        </tr>`).join('')
    : '<tr><td colspan="3" style="padding:12px;color:#888;text-align:center;">No new leads</td></tr>';

  const taskRows = data.overdueTasks.length > 0
    ? data.overdueTasks.slice(0, 5).map(t => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${t.title}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">
            <span style="color:${t.priority === 'urgent' ? '#9C0006' : t.priority === 'high' ? '#9C5700' : '#555'};font-weight:bold;">${t.priority}</span>
          </td>
        </tr>`).join('')
    : '<tr><td colspan="2" style="padding:12px;color:#888;text-align:center;">No pending tasks</td></tr>';

  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:30px 20px;">
    <tr><td align="center">
      <table width="640" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;">
        <!-- Header -->
        <tr><td style="background:#1B3A6B;padding:24px 32px;">
          <h1 style="color:#C8A951;font-size:22px;margin:0;">☀️ Daily Brief — Latimore OS</h1>
          <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:6px 0 0;">${data.date}</p>
        </td></tr>

        <!-- KPI Strip -->
        <tr><td style="background:#f8f6f0;padding:16px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="text-align:center;padding:0 16px;">
                <div style="font-size:28px;font-weight:bold;color:#1B3A6B;">${data.appointments.length}</div>
                <div style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;">Appointments</div>
              </td>
              <td style="text-align:center;padding:0 16px;border-left:1px solid #e0e0e0;">
                <div style="font-size:28px;font-weight:bold;color:#C8A951;">${data.newLeads.length}</div>
                <div style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;">New Leads</div>
              </td>
              <td style="text-align:center;padding:0 16px;border-left:1px solid #e0e0e0;">
                <div style="font-size:28px;font-weight:bold;color:#9C5700;">${data.overdueTasks.length}</div>
                <div style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;">Tasks Due</div>
              </td>
              <td style="text-align:center;padding:0 16px;border-left:1px solid #e0e0e0;">
                <div style="font-size:28px;font-weight:bold;color:#276221;">${data.pipeline.reduce((s, p) => s + (p.count || 0), 0)}</div>
                <div style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;">Pipeline</div>
              </td>
            </tr>
          </table>
        </td></tr>

        <tr><td style="padding:24px 32px;">
          <!-- Appointments -->
          <h3 style="color:#1B3A6B;margin:0 0 12px;font-size:16px;">📅 Today's Appointments</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e0e0e0;border-radius:6px;overflow:hidden;margin-bottom:24px;">
            <tr style="background:#f5f5f5;">
              <th style="padding:8px 12px;text-align:left;font-size:12px;color:#555;text-transform:uppercase;">Time</th>
              <th style="padding:8px 12px;text-align:left;font-size:12px;color:#555;text-transform:uppercase;">Type</th>
              <th style="padding:8px 12px;text-align:left;font-size:12px;color:#555;text-transform:uppercase;">Status</th>
            </tr>
            ${apptRows}
          </table>

          <!-- New Leads -->
          <h3 style="color:#1B3A6B;margin:0 0 12px;font-size:16px;">🔔 New Leads (Last 24h)</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e0e0e0;border-radius:6px;overflow:hidden;margin-bottom:24px;">
            <tr style="background:#f5f5f5;">
              <th style="padding:8px 12px;text-align:left;font-size:12px;color:#555;text-transform:uppercase;">Name</th>
              <th style="padding:8px 12px;text-align:left;font-size:12px;color:#555;text-transform:uppercase;">Source</th>
              <th style="padding:8px 12px;text-align:left;font-size:12px;color:#555;text-transform:uppercase;">When</th>
            </tr>
            ${leadRows}
          </table>

          <!-- Tasks -->
          <h3 style="color:#1B3A6B;margin:0 0 12px;font-size:16px;">✅ Pending Tasks</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e0e0e0;border-radius:6px;overflow:hidden;margin-bottom:24px;">
            <tr style="background:#f5f5f5;">
              <th style="padding:8px 12px;text-align:left;font-size:12px;color:#555;text-transform:uppercase;">Task</th>
              <th style="padding:8px 12px;text-align:left;font-size:12px;color:#555;text-transform:uppercase;">Priority</th>
            </tr>
            ${taskRows}
          </table>

          <!-- CTA -->
          <div style="text-align:center;margin-top:8px;">
            <a href="https://hub.latimorelifelegacy.com/admin/dashboard" style="display:inline-block;background:#1B3A6B;color:#C8A951;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:15px;">
              Open Latimore OS →
            </a>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f0f0f0;padding:16px 32px;text-align:center;border-top:1px solid #e0e0e0;">
          <p style="color:#888;font-size:12px;margin:0;">Protecting Today. Securing Tomorrow. #TheBeatGoesOn<br>
          PA DOI #1268820 | latimorelifelegacy.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York',
    });
  } catch { return iso; }
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}