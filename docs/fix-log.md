# Latimore OS Fix Log

## Current Required Fixes

- Add explicit `turbopack.root` in `next.config.js`.
- Validate required Supabase, Resend, Google Chat, GA, and GTM environment variables.
- Replace Twilio notification path with Google Chat webhook.
- Ensure service cards route to `/education` or `/legacy-checkup`.
- Preserve GBP and PAHS source tracking through lead capture.
- Harden `/api/fillout` and `/api/pahs-lead` with validation and explicit JSON responses.
- Confirm Vercel production env vars match `.env.local`.

## 2026-06-16 Audit Loop Patch

- Pinned Turbopack to the repository directory so Next.js does not select a parent workspace lockfile.
- Added a shared required environment-variable helper for lead intake routes.
- Routed service-page CTAs into `/education` with Google Business Profile UTM and source attribution.
- Hardened Fillout, consultation, and PAHS lead responses so failed capture returns explicit JSON errors.
- Added Google Chat webhook notification support for lead intake alerts.

## 2026-06-16 Audit Findings Integrity Patch

- **Issue (P0-1) Environment configuration drift** — Production could boot with Supabase/Resend/Google Chat credentials missing, silently dropping leads and notifications at runtime instead of failing the deploy.
  - **Root cause**: `validateEnv()` only checked admin/auth vars; the lead-pipeline vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `GOOGLE_CHAT_WEBHOOK_URL`) were never enforced at startup.
  - **Fix**: Extended `lib/env.ts`'s `REQUIRED_IN_PRODUCTION` list and call `validateEnv()` from `instrumentation.ts::register()` so a misconfigured deploy throws on boot.
  - **Verification method**: `npm run check` (tsc --noEmit) passes; manually confirmed `instrumentation.ts` only runs the check under `NEXT_RUNTIME === 'nodejs'` and `isProduction`.
  - **Deployment status**: Ready — no schema or infra changes required.

- **Issue (P0-2) Webhook idempotency** — Fillout/booking webhook retries (network timeouts, provider redelivery) could create duplicate contacts, inquiries, and appointments.
  - **Root cause**: No record of previously processed webhook event IDs; every delivery re-ran the full ingestion path.
  - **Fix**: Added `ProcessedWebhook` model (`prisma/schema.prisma`, migration `20260616000000_add_processed_webhooks`) and `lib/hub/webhook-idempotency.ts::claimWebhookEvent()`, wired into `app/api/webhooks/fillout/route.ts`, `app/api/webhooks/booking/route.ts`, and `app/api/fillout-webhook/route.ts`. Each route derives a stable event ID (provider's submission/event ID, falling back to a SHA-256 hash of the payload) and short-circuits with `{ ok: true, deduped: true }` on replay.
  - **Verification method**: `npm run check` passes; unique constraint on `(provider, eventId)` enforced at the DB level as a backstop against race conditions.
  - **Deployment status**: Requires running `npm run db:deploy` to apply the new migration before the updated webhook routes go live.

- **Issue (P0-3) CRM state-transition validation** — Inquiries could jump stages in ways that don't reflect a real sales process (e.g. New → Sold) via the patch API.
  - **Root cause**: `changeInquiryStage` wrote whatever stage was requested with no transition graph.
  - **Fix**: Added `lib/hub/pipeline-transitions.ts` (`canTransition`/`assertTransition`/`InvalidStageTransitionError`) and gated `lib/hub/change-stage.ts` on it unless the caller passes `force: true`. `app/api/inquiries/[id]/route.ts` now returns `409 invalid_transition` instead of silently applying an invalid jump, with a `force` escape hatch surfaced through `lib/schemas.ts`'s `InquiryPatchSchema`. System-driven booking flows (`lib/hub/record-appointment.ts`, `app/api/appointments/book/route.ts`) intentionally pass `force: true` since a real-world booking event shouldn't be blocked by pipeline hygiene rules.
  - **Verification method**: `npm run check` passes. Manually traced all four `changeInquiryStage` call sites to confirm none regress under the new gate.
  - **Deployment status**: Ready — no schema changes required.

- **Issue (P1-4) Booking synchronization** — Appointment creation, task completion, stage advancement, and the communication log could partially fail and leave the lead record inconsistent.
  - **Root cause**: `recordAppointment` performed these writes as separate, unguarded Prisma calls.
  - **Fix**: Wrapped appointment creation, stage update, stage history, task completion, and note creation in a single `prisma.$transaction` in `lib/hub/record-appointment.ts`; transaction failures are reported via `captureException` before rethrowing.
  - **Verification method**: `npm run check` passes; reviewed transaction for write-skew risk (none — single inquiry/contact scope).
  - **Deployment status**: Ready — no schema changes required.

- **Issue (P1-5) Dashboard KPI consistency** — Report and dashboard endpoints independently recomputed lead/booking/conversion counts, risking drift between displayed numbers.
  - **Root cause**: No shared metrics module; each endpoint wrote its own Prisma aggregation queries.
  - **Fix**: Added `lib/kpis.ts` (`getLeadMetrics`, `getBookingMetrics`, `getConversionMetrics`) as the single source of truth, and refactored `app/api/reports/conversions/route.ts` to consume `getConversionMetrics()` instead of duplicating the query.
  - **Verification method**: `npm run check` passes; confirmed output shape of `getConversionMetrics()` matches the previous inline implementation exactly.
  - **Deployment status**: Ready — no schema changes required. Remaining report endpoints can be migrated onto `lib/kpis.ts` incrementally.

- **Issue (P1-6) Error telemetry gap** — API, webhook, Supabase, and notification failures were only logged locally with no centralized capture, making production incidents hard to triage.
  - **Root cause**: Failures were handled with ad hoc `logger.error`/`console.error` calls with no aggregation or alerting path.
  - **Fix**: Added `lib/error-tracking.ts::captureException()` — logs structurally via pino and optionally forwards to Sentry's HTTP store API when `SENTRY_DSN` is set (no new dependency required). Wired into the Fillout, booking, and PAHS webhook handlers, `lib/mailer.ts`, `lib/hub/record-appointment.ts`, and `app/api/appointments/book/route.ts`, each tagged with a `source` and lead/contact identifiers where available.
  - **Verification method**: `npm run check` passes; confirmed `captureException` no-ops the network call gracefully when `SENTRY_DSN` is unset.
  - **Deployment status**: Ready. Set `SENTRY_DSN` in production env to enable remote forwarding; logging-only mode works without it.

- **Issue (P2-7) Service page conversion path audit** — Verified every service CTA funnels into the single `/education?service=<slug>` entry point.
  - **Root cause**: N/A — audited and confirmed already correct.
  - **Fix**: No code changes required.
  - **Verification method**: Manual review of service page CTA hrefs.
  - **Deployment status**: N/A.

- **Issue (P2-8) Fix-log governance** — This entry. Documents the full remediation set above per the audit's required Date/Issue/Root Cause/Fix/Verification Method/Deployment Status format.
