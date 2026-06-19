/**
 * LATIMORE OS — CLOUDFLARE WORKER
 * Edge intake layer: QR tracking, lead intake, webhooks, scheduled jobs
 * Protecting Today. Securing Tomorrow. #TheBeatGoesOn
 */

import { handleQRTrack } from './handlers/qr';
import { handleLeadIntake } from './handlers/lead';
import { handleFilloutWebhook } from './handlers/fillout';
import { handleBookingWebhook } from './handlers/booking';
import { handleContentClick } from './handlers/content';
import { handleDailyBrief } from './handlers/daily-brief';
import { handleWeeklyKPI } from './handlers/weekly-kpi';
import { handleMonthlySnapshot } from './handlers/monthly-snapshot';
import { processLeadQueue } from './queues/lead-queue';
import { processWorkflowQueue } from './queues/workflow-queue';
import { corsHeaders, errorResponse, jsonResponse } from './lib/response';
import { verifyWorkerSecret } from './lib/auth';

export interface Env {
  // Secrets
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  RESEND_API_KEY: string;
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
  TWILIO_PHONE_NUMBER: string;
  WORKER_SECRET: string;
  ANTHROPIC_API_KEY: string;

  // Queues
  LEAD_QUEUE: Queue;
  WORKFLOW_QUEUE: Queue;

  // Vars
  ENVIRONMENT: string;
  APP_URL: string;
  HUB_URL: string;
}

// ── MAIN FETCH HANDLER ────────────────────────────────────────────────────────
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(env.APP_URL) });
    }

    try {
      // ── PUBLIC ROUTES (no auth required) ──────────────────────────────────

      // QR code scan tracking
      // GET /api/track/qr/:codeId
      if (method === 'GET' && path.startsWith('/api/track/qr/')) {
        const codeId = path.split('/api/track/qr/')[1];
        return handleQRTrack(request, env, ctx, codeId);
      }

      // Lead intake (from landing pages)
      // POST /api/lead
      if (method === 'POST' && path === '/api/lead') {
        return handleLeadIntake(request, env, ctx);
      }

      // Content click tracking
      // POST /api/events/content-click
      if (method === 'POST' && path === '/api/events/content-click') {
        return handleContentClick(request, env, ctx);
      }

      // ── WEBHOOK ROUTES (signature verified) ───────────────────────────────

      // Fillout form webhook
      // POST /api/webhooks/fillout
      if (method === 'POST' && path === '/api/webhooks/fillout') {
        return handleFilloutWebhook(request, env, ctx);
      }

      // Booking/calendar webhook
      // POST /api/webhooks/booking
      if (method === 'POST' && path === '/api/webhooks/booking') {
        return handleBookingWebhook(request, env, ctx);
      }

      // ── INTERNAL ROUTES (worker secret required) ──────────────────────────

      // Verify worker secret for internal routes
      if (path.startsWith('/api/internal/')) {
        const authResult = verifyWorkerSecret(request, env.WORKER_SECRET);
        if (!authResult.valid) {
          return errorResponse(401, 'Unauthorized');
        }
      }

      // Manual trigger: daily brief
      // POST /api/internal/jobs/daily-brief
      if (method === 'POST' && path === '/api/internal/jobs/daily-brief') {
        return handleDailyBrief(request, env, ctx);
      }

      // Manual trigger: weekly KPI
      // POST /api/internal/jobs/weekly-kpi
      if (method === 'POST' && path === '/api/internal/jobs/weekly-kpi') {
        return handleWeeklyKPI(request, env, ctx);
      }

      // Health check
      // GET /api/health
      if (method === 'GET' && path === '/api/health') {
        return jsonResponse({ status: 'ok', timestamp: new Date().toISOString(), env: env.ENVIRONMENT });
      }

      return errorResponse(404, 'Not found');

    } catch (err) {
      console.error('[Worker] Unhandled error:', err);
      return errorResponse(500, 'Internal server error');
    }
  },

  // ── SCHEDULED HANDLER (cron triggers) ────────────────────────────────────
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const cron = event.cron;
    console.log(`[Worker] Scheduled trigger: ${cron}`);

    try {
      if (cron === '0 8 * * *') {
        // Daily brief — 8am ET every day
        await handleDailyBrief(null, env, ctx);
      } else if (cron === '0 9 * * 1') {
        // Weekly KPI report — Monday 9am ET
        await handleWeeklyKPI(null, env, ctx);
      } else if (cron === '0 0 1 * *') {
        // Monthly snapshot — 1st of month
        await handleMonthlySnapshot(null, env, ctx);
      }
    } catch (err) {
      console.error(`[Worker] Scheduled job failed (${cron}):`, err);
    }
  },

  // ── QUEUE HANDLER ─────────────────────────────────────────────────────────
  async queue(batch: MessageBatch, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log(`[Worker] Queue batch: ${batch.queue}, messages: ${batch.messages.length}`);

    try {
      if (batch.queue === 'lead-intake') {
        await processLeadQueue(batch, env, ctx);
      } else if (batch.queue === 'workflow-trigger') {
        await processWorkflowQueue(batch, env, ctx);
      }
    } catch (err) {
      console.error(`[Worker] Queue processing failed (${batch.queue}):`, err);
      // Retry all messages
      batch.retryAll();
    }
  },
};