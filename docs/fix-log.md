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

## 2026-06-16 Deployment Unblock

- **Issue: CI typecheck failure in `/api/pahs-lead`** — `tsc --noEmit` failed with `TS2554` (extra argument to `sendNotification`) and `TS2304` (`target` is not defined), blocking the build/test GitHub Actions check on PR #186.
  - **Root cause**: A merge of two divergent feature branches left duplicate, conflicting save/notify logic in `POST` — one block correctly called `saveToCRM`/`saveToSupabase` once and fanned out to `sendNotification`/`createCalendarReminder`, while a second leftover block re-ran the save a second time against an undefined `target` variable and called `sendNotification` with the old single-argument signature.
  - **Fix**: Removed the dead duplicate block; the lead is now saved once, and `sendNotification`/`createCalendarReminder` results are reported independently via `Promise.allSettled` in the response body (`email`, `calendar` keys) instead of via the removed `saveResult`/`emailResult` pair.
  - **Verification method**: `npx tsc --noEmit` passes with zero errors.
  - **Deployment status**: Ready — no schema or infra changes required.

- **Issue: Vercel deployment failure on PR #186** — Every deploy failed with "Hobby accounts are limited to daily cron jobs" because `vercel.json` scheduled `/api/cron/overdue-leads` hourly (`0 * * * *`).
  - **Root cause**: Pre-existing `vercel.json` cron entry exceeded the Hobby plan's once-per-day cron limit; this predates this branch but blocks every deploy of it.
  - **Fix**: Removed the `/api/cron/overdue-leads` entry from `vercel.json`'s `crons` array and added `.github/workflows/cron-overdue-leads.yml`, an hourly GitHub Actions workflow that calls the route directly with the `x-cron-secret` header — consistent with the "Supabase Cron primary, GitHub Actions backup" scheduling model already used for Latimore OS automation. Requires `PRODUCTION_URL` and `CRON_SECRET` repository secrets to be set in GitHub Actions settings.
  - **Verification method**: `vercel.json` now only declares the two daily crons (`daily-brief`, `appointment-reminders`), which are within Hobby-plan limits.
  - **Deployment status**: Requires adding `PRODUCTION_URL` and `CRON_SECRET` as GitHub Actions repository secrets for the new workflow to run; the deployment-blocking issue itself is resolved without any new secrets.

## 2026-06-17 Lead Pipeline Hardening Patch

- **Issue: Cross-channel duplicate lead risk** — The CRM service compared raw phone strings, so `7176152613`, `(717) 615-2613`, and `1-717-615-2613` could become separate contacts.
  - **Root cause**: `upsertLead()` trimmed phone numbers but did not canonicalize them before lookup or persistence.
  - **Fix**: Added `normalizePhone()` and updated `upsertLead()` to dedupe on both normalized and legacy raw phone formats before creating a contact.
  - **Verification method**: Code-level verification through the shared CRM ingestion path; latest Vercel status is pending.
  - **Deployment status**: Committed to `main` in `544de8d5df62ed46a1be87b6c685179bff827d27`.

- **Issue: Campaign reporting fragmentation** — PAHS, PAHS2026, PAHS Protect, GBP, Google Business Profile, and referral campaigns could report as separate buckets.
  - **Root cause**: Campaign values were persisted directly from route payloads.
  - **Fix**: Expanded `normalizeCampaign()` aliases and applied the normalizer inside `upsertLead()` before inquiry/event/system-event writes.
  - **Verification method**: Code-level verification through `lib/hub/upsert-lead.ts` and `lib/hub/normalizers.ts`; no schema change required.
  - **Deployment status**: Committed to `main` in `5782ab84670e14a35e23773ffeea1814caa7b099` and `544de8d5df62ed46a1be87b6c685179bff827d27`.

- **Issue: PAHS source attribution loss** — `/api/pahs-lead` accepted only partial UTM fields and did not persist `utm_term`, `utm_content`, or referrer into the CRM path.
  - **Root cause**: The route's payload model and `saveToCRM()` mapper only carried source, medium, and campaign.
  - **Fix**: Added camelCase and snake_case UTM support, forwarded term/content/referrer to `upsertLead()`, and included those values in Google Calendar follow-up context and Google Chat notification text.
  - **Verification method**: Code-level verification of `ValidatedLead`, `saveToCRM()`, `sendNotification()`, and response behavior.
  - **Deployment status**: Committed to `main` in `895392c43e30d396a1383c045e57f1fd57b15386`.

- **Issue: Google Chat notification reliability** — A single transient webhook failure could mark notification delivery failed.
  - **Root cause**: `sendGoogleChatMessage()` had no retry loop and surfaced only the HTTP status.
  - **Fix**: Added three-attempt retry handling with short backoff and clearer failure detail.
  - **Verification method**: Code-level verification; route-level failures remain contained by `Promise.allSettled()` in `/api/pahs-lead`.
  - **Deployment status**: Committed to `main` in `51ca55912f96895ffec8076ede1be613b9a61766`.

- **Issue: Fillout ingestion still had a direct legacy Supabase write** — The Fillout webhook wrote to a `leads` table and then called `upsertLead()`, leaving the lead pipeline split.
  - **Root cause**: Legacy mirror code stayed active inside the webhook after the CRM service became the authoritative ingestion path.
  - **Fix**: Moved the legacy Supabase mirror behind `FILLOUT_LEGACY_SUPABASE_SYNC=true`, changed the default path to CRM-only, added referrer/landing-page preservation, and returned contact/inquiry identifiers from the webhook.
  - **Verification method**: Code-level verification of `app/api/fillout-webhook/route.ts`; no schema change required.
  - **Deployment status**: Committed to `main` in `d6386112da248b8d1f004cd354ae9d8f09183700`.
