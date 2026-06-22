/**
 * Send Worker
 * Sends emails and SMS messages, logs to communications table
 */

import { BaseWorker } from '../types';
import type { WorkerInput, WorkerOutput, WorkerEnv } from '../types';
import { createDBClient } from '../lib/supabase';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export class SendWorker extends BaseWorker {
  name = 'SendWorker';
  description = 'Sends emails and SMS, logs all communications to CRM';

  async execute(input: WorkerInput, env: WorkerEnv): Promise<WorkerOutput> {
    const db = createDBClient(env);
    const contactId = input.contact_id as string || input.context.contact_id as string;
    const draft = input.draft as { subject?: string; body: string; sms?: string } || {};
    const compliance = input.compliance as { passed?: boolean; violations?: Array<{ severity: string }> } | undefined;
    const sendEmail = input.send_email !== false && !!input.email;
    const sendSMS = input.send_sms !== false && !!input.phone;
    const email = input.email as string || '';
    const phone = input.phone as string || '';
    const firstName = input.first_name as string || 'Friend';

    // Approval gate — a workflow can pass the upstream ComplianceReviewer
    // output through to this step (see input_map: { compliance: 'compliance' }
    // in the workflow definition). If it failed, never send automatically;
    // hold for manual review instead. Retrying wouldn't help — the draft
    // itself is what's flagged — so this returns success rather than a
    // failure the orchestrator would retry.
    if (compliance && compliance.passed === false) {
      this.error(`Send blocked by compliance review for contact ${contactId || 'unknown'}`);

      if (contactId) {
        await db.tasks.create({
          contact_id: contactId,
          title: `Compliance hold: review draft before sending to ${firstName}`,
          description: 'Automated send was blocked because the draft failed compliance review. Review and send manually.',
          task_type: 'compliance_review',
          status: 'pending',
          priority: 'high',
          due_at: new Date(Date.now() + 2 * 3600000).toISOString(),
          is_automated: true,
          workflow_run_id: input.context.run_id as string || null,
        });
      }

      return {
        success: true,
        data: { sent_email: false, sent_sms: false, held_for_compliance: true },
        actions_taken: ['held_for_compliance_review'],
      };
    }

    this.log(`Sending to ${firstName} (email: ${sendEmail}, sms: ${sendSMS})`);

    const actionsTaken: string[] = [];
    let totalTokens = 0;

    try {
      // Send email
      if (sendEmail && email && draft.subject && draft.body) {
        const emailResult = await this.sendEmail(env, {
          to: email,
          subject: draft.subject,
          body: draft.body,
          firstName,
        });

        if (emailResult.success) {
          actionsTaken.push('email_sent');

          // Log to communications table
          if (contactId) {
            await db.communications.create({
              contact_id: contactId,
              channel: 'email',
              direction: 'outbound',
              subject: draft.subject,
              body_preview: draft.body.substring(0, 200),
              status: 'sent',
              sent_at: new Date().toISOString(),
              resend_id: emailResult.id,
            });
          }
        } else {
          this.error(`Email send failed: ${emailResult.error}`);
        }
      }

      // Send SMS
      if (sendSMS && phone && draft.sms) {
        const smsResult = await this.sendSMS(env, {
          to: phone,
          body: draft.sms,
        });

        if (smsResult.success) {
          actionsTaken.push('sms_sent');

          // Log to communications table
          if (contactId) {
            await db.communications.create({
              contact_id: contactId,
              channel: 'sms',
              direction: 'outbound',
              body_preview: draft.sms.substring(0, 200),
              status: 'sent',
              sent_at: new Date().toISOString(),
              twilio_sid: smsResult.sid,
            });
          }
        } else {
          this.error(`SMS send failed: ${smsResult.error}`);
        }
      }

      // Update contact last_contacted_at
      if (contactId && actionsTaken.length > 0) {
        await db.contacts.update(contactId, {
          last_contacted_at: new Date().toISOString(),
          next_follow_up_at: new Date(Date.now() + 3 * 24 * 3600000).toISOString(), // 3 days
        });
        actionsTaken.push('contact_updated');
      }

      return {
        success: true,
        data: {
          sent_email: actionsTaken.includes('email_sent'),
          sent_sms: actionsTaken.includes('sms_sent'),
          contact_updated: actionsTaken.includes('contact_updated'),
        },
        actions_taken: actionsTaken,
        tokens_used: totalTokens,
      };

    } catch (err) {
      this.error('Send failed', err);
      return { success: false, error: String(err) };
    }
  }

  // ── EMAIL via Resend ───────────────────────────────────────────────────────

  private async sendEmail(
    env: WorkerEnv,
    opts: { to: string; subject: string; body: string; firstName: string }
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const html = this.buildEmailHTML(opts.firstName, opts.body);

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Jackson Latimore <Jackson1989@latimorelegacy.com>',
          to: [opts.to],
          subject: opts.subject,
          html,
          reply_to: 'Jackson1989@latimorelegacy.com',
          tags: [{ name: 'type', value: 'agent_harness_followup' }],
        }),
      });

      const data = await response.json() as { id?: string; message?: string };
      if (!response.ok) return { success: false, error: data.message };
      return { success: true, id: data.id };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  // ── SMS via Twilio ─────────────────────────────────────────────────────────

  private async sendSMS(
    env: WorkerEnv,
    opts: { to: string; body: string }
  ): Promise<{ success: boolean; sid?: string; error?: string }> {
    try {
      const phone = this.formatPhone(opts.to);
      const credentials = btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`);

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: phone,
            From: env.TWILIO_PHONE_NUMBER,
            Body: opts.body,
          }).toString(),
        }
      );

      const data = await response.json() as { sid?: string; error_message?: string };
      if (!response.ok) return { success: false, error: data.error_message };
      return { success: true, sid: data.sid };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  // ── HELPERS ────────────────────────────────────────────────────────────────

  private buildEmailHTML(firstName: string, body: string): string {
    const htmlBody = body
      .split('\n')
      .map(line => line.trim() ? `<p style="margin:0 0 12px;color:#555;font-size:16px;line-height:1.6;">${escapeHtml(line)}</p>` : '<br>')
      .join('');

    return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;">
        <tr><td style="background:#0E1A2B;padding:28px 40px;text-align:center;">
          <h1 style="color:#C9A25F;font-size:24px;margin:0;font-family:Georgia,serif;">LATIMORE LIFE & LEGACY</h1>
          <p style="color:rgba(255,255,255,0.75);font-size:13px;margin:6px 0 0;font-style:italic;">Protecting Today. Securing Tomorrow.</p>
        </td></tr>
        <tr><td style="padding:36px 40px;">
          ${htmlBody}
        </td></tr>
        <tr><td style="background:#f0f0f0;padding:16px 40px;text-align:center;border-top:1px solid #e0e0e0;">
          <p style="color:#888;font-size:11px;margin:0;">PA DOI #1268820 | Latimore Life & Legacy LLC | latimorelifelegacy.com<br>
          <a href="https://latimorelifelegacy.com/unsubscribe" style="color:#888;">Unsubscribe</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  private formatPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
    return `+${digits}`;
  }
}