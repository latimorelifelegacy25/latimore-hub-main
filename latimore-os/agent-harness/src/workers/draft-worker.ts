/**
 * Draft Worker
 * Uses LLM to draft personalized follow-up messages, emails, and content
 */

import { BaseWorker } from '../types';
import type { WorkerInput, WorkerOutput, WorkerEnv } from '../types';
import { callOpenAI, LATIMORE_SYSTEM_PROMPT } from '../lib/llm';

export class DraftWorker extends BaseWorker {
  name = 'DraftWorker';
  description = 'Drafts personalized messages, emails, and content using LLM';

  async execute(input: WorkerInput, env: WorkerEnv): Promise<WorkerOutput> {
    const draftType = input.draft_type as string || 'follow_up_email';
    const contactSummary = input.contact_summary as string || '';
    const contactProfile = input.contact as Record<string, unknown> || {};
    const interest = input.interest as string || contactProfile.interest as string || 'life insurance';
    const source = input.source as string || contactProfile.lead_source as string || 'website';
    const firstName = contactProfile.first_name as string || input.first_name as string || 'Friend';

    this.log(`Drafting ${draftType} for ${firstName}`);

    try {
      let draft: { subject?: string; body: string; sms?: string };

      switch (draftType) {
        case 'follow_up_email':
          draft = await this.draftFollowUpEmail(env, firstName, contactSummary, interest, source);
          break;
        case 'follow_up_sms':
          draft = await this.draftFollowUpSMS(env, firstName, interest);
          break;
        case 'no_show_recovery':
          draft = await this.draftNoShowRecovery(env, firstName, contactSummary);
          break;
        case 'gbp_post':
          draft = await this.draftGBPPost(env, input.topic as string || 'life insurance');
          break;
        case 'social_post':
          draft = await this.draftSocialPost(env, input.platform as string || 'facebook', input.topic as string || 'life insurance', input.content_pillar as string || 'education');
          break;
        default:
          draft = await this.draftFollowUpEmail(env, firstName, contactSummary, interest, source);
      }

      this.log(`Draft complete: ${draftType}`);

      return {
        success: true,
        data: { draft_type: draftType, ...draft },
        tokens_used: 0, // updated by LLM calls
      };

    } catch (err) {
      this.error('Draft failed', err);
      return { success: false, error: String(err) };
    }
  }

  // ── FOLLOW-UP EMAIL ────────────────────────────────────────────────────────

  private async draftFollowUpEmail(
    env: WorkerEnv,
    firstName: string,
    contactSummary: string,
    interest: string,
    source: string
  ): Promise<{ subject: string; body: string; sms: string }> {
    const response = await callOpenAI(env, [
      { role: 'system', content: LATIMORE_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Draft a personalized follow-up email for a new lead.

Contact Profile:
${contactSummary || `Name: ${firstName}, Interest: ${interest}, Source: ${source}`}

Requirements:
- Warm, personal opening using their first name
- Reference their specific interest (${interest})
- Educational value — teach something useful, don't just pitch
- Soft CTA: invite them to schedule a free 15-minute consultation
- Booking link placeholder: [BOOKING_LINK]
- Signature: Jackson M. Latimore Sr., MBA | (717) 615-2613 | latimorelifelegacy.com
- Tone: warm, professional, non-pressured
- Length: 150-200 words
- End with: "Protecting Today. Securing Tomorrow."

Return JSON with keys: subject (string), body (string, plain text with line breaks as \\n)`
      }
    ], { json: true, temperature: 0.4, max_tokens: 600 });

    try {
      const parsed = JSON.parse(response.content) as { subject: string; body: string };
      const smsResponse = await this.draftFollowUpSMS(env, firstName, interest);
      return { subject: parsed.subject, body: parsed.body, sms: smsResponse.body };
    } catch {
      return {
        subject: `Following up — Latimore Life & Legacy`,
        body: `Hi ${firstName},\n\nThank you for reaching out to Latimore Life & Legacy. I'd love to connect and learn more about your ${interest} needs.\n\nWould you be available for a free 15-minute consultation? Book here: [BOOKING_LINK]\n\nProtecting Today. Securing Tomorrow.\n\nJackson M. Latimore Sr., MBA\n(717) 615-2613`,
        sms: `Hi ${firstName}! Jackson Latimore here. Thanks for your interest in ${interest}. Book your free consultation: [BOOKING_LINK] #TheBeatGoesOn`,
      };
    }
  }

  // ── FOLLOW-UP SMS ──────────────────────────────────────────────────────────

  private async draftFollowUpSMS(
    env: WorkerEnv,
    firstName: string,
    interest: string
  ): Promise<{ body: string }> {
    const response = await callOpenAI(env, [
      { role: 'system', content: LATIMORE_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Draft a brief, warm follow-up SMS for ${firstName} who expressed interest in ${interest}.

Requirements:
- Max 160 characters
- Personal, not robotic
- Include booking link placeholder: [BOOKING_LINK]
- End with #TheBeatGoesOn
- No pressure, just helpful

Return JSON with key: body (string)`
      }
    ], { json: true, temperature: 0.4, max_tokens: 100 });

    try {
      const parsed = JSON.parse(response.content) as { body: string };
      return { body: parsed.body };
    } catch {
      return { body: `Hi ${firstName}! Jackson Latimore here. Ready to help with your ${interest} needs. Book free: [BOOKING_LINK] #TheBeatGoesOn` };
    }
  }

  // ── NO-SHOW RECOVERY ───────────────────────────────────────────────────────

  private async draftNoShowRecovery(
    env: WorkerEnv,
    firstName: string,
    contactSummary: string
  ): Promise<{ subject: string; body: string; sms: string }> {
    const response = await callOpenAI(env, [
      { role: 'system', content: LATIMORE_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Draft a no-show recovery message for ${firstName} who missed their scheduled consultation.

Contact context:
${contactSummary}

Requirements:
- Empathetic, zero judgment — life gets busy
- Offer to reschedule easily
- Rescheduling link placeholder: [BOOKING_LINK]
- Keep it brief (under 100 words for email body)
- Tone: understanding, warm, not pushy

Return JSON with keys: subject (string), body (string), sms (string, max 160 chars)`
      }
    ], { json: true, temperature: 0.3, max_tokens: 400 });

    try {
      return JSON.parse(response.content) as { subject: string; body: string; sms: string };
    } catch {
      return {
        subject: `No worries — let\'s reschedule, ${firstName}`,
        body: `Hi ${firstName},\n\nI noticed we missed our appointment — no worries at all, life gets busy!\n\nWhenever you\'re ready, I\'d love to connect. Reschedule here: [BOOKING_LINK]\n\nProtecting Today. Securing Tomorrow.\nJackson`,
        sms: `Hi ${firstName}, Jackson here. Missed you today — no worries! Reschedule anytime: [BOOKING_LINK] #TheBeatGoesOn`,
      };
    }
  }

  // ── GBP POST ───────────────────────────────────────────────────────────────

  private async draftGBPPost(
    env: WorkerEnv,
    topic: string
  ): Promise<{ body: string }> {
    const response = await callOpenAI(env, [
      { role: 'system', content: LATIMORE_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Draft a Google Business Profile post for Latimore Life & Legacy about: ${topic}

Requirements:
- 150-300 characters
- Educational or community-focused
- Include a CTA (call, visit website, or book)
- Professional but warm
- No specific premium quotes or guarantees

Return JSON with key: body (string)`
      }
    ], { json: true, temperature: 0.5, max_tokens: 200 });

    try {
      return JSON.parse(response.content) as { body: string };
    } catch {
      return { body: `Protecting families in Schuylkill County with life insurance and retirement solutions. Free consultations available. Call (717) 615-2613 or visit latimorelifelegacy.com. #TheBeatGoesOn` };
    }
  }

  // ── SOCIAL POST ────────────────────────────────────────────────────────────

  private async draftSocialPost(
    env: WorkerEnv,
    platform: string,
    topic: string,
    contentPillar: string
  ): Promise<{ body: string; hashtags: string[] }> {
    const platformGuidance: Record<string, string> = {
      facebook: 'conversational, 150-300 words, storytelling, end with CTA and hashtags',
      instagram: 'visual-first caption, 50-150 words, strong hook, 5-10 hashtags',
      linkedin: 'professional, 100-200 words, thought leadership, 3-5 hashtags',
    };

    const response = await callOpenAI(env, [
      { role: 'system', content: LATIMORE_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Draft a ${platform} post for Latimore Life & Legacy.

Topic: ${topic}
Content Pillar: ${contentPillar}
Platform guidance: ${platformGuidance[platform] || platformGuidance.facebook}

Brand voice: Bold, warm, educational, motivational.
Always include #TheBeatGoesOn and #LatimoreLifeAndLegacy.
Never make specific premium guarantees.
End with a soft CTA (DM PROTECT, comment below, or link in bio).

Return JSON with keys: body (string), hashtags (string array)`
      }
    ], { json: true, temperature: 0.6, max_tokens: 500 });

    try {
      return JSON.parse(response.content) as { body: string; hashtags: string[] };
    } catch {
      return {
        body: `Protecting families in Schuylkill County — one policy at a time. DM us PROTECT for your free consultation. #TheBeatGoesOn`,
        hashtags: ['#LatimoreLifeAndLegacy', '#ProtectingTodaySecuringTomorrow', '#TheBeatGoesOn', '#LifeInsurance'],
      };
    }
  }
}