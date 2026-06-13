# API Route Inventory

Generated for SPEC-1 MVP Hardening, Milestone 1 (Phase 0). Each route under `app/api/**/route.ts` is
classified by intended audience and audited for the presence of admin auth, cron-secret auth,
Zod validation, rate limiting, and webhook signature checks.

Classification legend:
- **public** – intentionally callable without authentication (lead/event ingest, health check, public booking)
- **admin** – under `/api/admin/**`, must require an authenticated admin session
- **cron** – under `/api/cron/**`, must require `CRON_SECRET`
- **webhook** – third-party webhook receivers, must verify a signature/shared secret
- **app** – other application routes (CRM, AI, content, social, reports, documents, etc.) that require
  case-by-case review for the correct guard

Status legend:
- **ok** – has an appropriate guard for its classification
- **BLOCKER** – confirmed security gap, must be fixed before/at this milestone
- **review** – needs a protection decision in Milestone 2/3 (role-aware admin guard, Zod schema, rate limit)

| Route | Methods | Class | Protection | Validation (Zod) | Rate limit | Status |
|---|---|---|---|---|---|---|
| `/api/admin/ai/asset` | POST | admin | admin session | no | no | ok |
| `/api/admin/ai/campaign` | POST | admin | admin session | no | no | ok |
| `/api/admin/ai/chat` | POST | admin | admin session | no | no | ok |
| `/api/admin/ai/client-snapshot` | POST | admin | admin session | no | no | ok |
| `/api/admin/ai/copilot` | POST | admin | admin session | no | yes | ok |
| `/api/admin/ai/funnel` | POST | admin | admin session | no | no | ok |
| `/api/admin/ai/generate-content` | POST | admin | admin session | no | no | ok |
| `/api/admin/ai/review-script` | POST | admin | admin session | no | no | ok |
| `/api/admin/ai/social` | POST | admin | admin session | no | no | ok |
| `/api/admin/ai/social-os` | POST | admin | admin session | no | no | ok |
| `/api/admin/crm` | GET,POST | admin | admin session | no | no | ok |
| `/api/admin/crm/contacts` | GET,POST | admin | admin session | no | no | ok |
| `/api/admin/crm/messages` | GET,POST | admin | admin session | no | no | ok |
| `/api/admin/insights` | GET,PATCH | admin | raw session check | no | no | ok |
| `/api/admin/insights/funnel` | GET | admin | admin session | no | no | ok |
| `/api/admin/marketing/publisher` | GET,POST | admin | admin session | no | no | ok |
| `/api/admin/marketing/publisher/cron` | GET | admin | cron secret | no | no | ok |
| `/api/admin/marketing/repository` | GET,POST | admin | admin session | no | no | ok |
| `/api/admin/notifications` | GET,POST | admin | admin session | no | no | ok |
| `/api/admin/social-connections` | GET,POST | admin | admin session | no | no | ok |
| `/api/admin/social-os/bulk-campaign` | POST | admin | admin session | no | no | ok |
| `/api/admin/social-os/chat` | POST | admin | admin session | no | no | ok |
| `/api/admin/social-posts` | GET,POST | admin | admin session | no | no | ok |
| `/api/admin/system` | GET | admin | admin session | no | no | ok |
| `/api/ai/agents/run` | POST | app | admin session | yes | yes | review |
| `/api/ai/contact-brief` | POST | app | admin session | yes | yes | review |
| `/api/ai/crm-assistant` | POST | app | admin session | yes | yes | review |
| `/api/ai/daily-brief` | GET,POST | app | admin session, cron secret | yes | yes | review |
| `/api/ai/daily-brief/latest` | GET | app | admin session | no | yes | review |
| `/api/ai/draft-message` | POST | app | admin session | yes | yes | review |
| `/api/ai/generate-tasks` | POST | app | raw session check | no | yes | review |
| `/api/ai/lead-score` | POST | app | admin session, cron secret | yes | yes | review |
| `/api/ai/sentiment` | POST | app | raw session check | no | yes | review |
| `/api/ai/sentiment/analyze` | POST | app | admin session | no | yes | review |
| `/api/analytics/ga4/callback` | GET | app | NONE | no | no | review |
| `/api/analytics/ga4/connect` | GET | app | NONE | no | no | review |
| `/api/analytics/ga4/data` | GET | app | admin session | no | no | review |
| `/api/analytics/ga4/status` | GET | app | NONE | no | no | review |
| `/api/analytics/report` | GET | app | signature/HMAC | no | no | review |
| `/api/analytics/social/sync` | POST | app | signature/HMAC | no | no | review |
| `/api/analytics/v1/ai` | GET | app | raw session check | yes | yes | review |
| `/api/analytics/v1/breakdowns` | GET | app | raw session check | yes | yes | review |
| `/api/analytics/v1/dashboard` | GET | app | raw session check | yes | yes | review |
| `/api/analytics/v1/export` | GET | app | raw session check | yes | yes | review |
| `/api/analytics/v1/funnel` | GET | app | raw session check | yes | yes | review |
| `/api/analytics/v1/jobs` | GET | app | raw session check | no | yes | review |
| `/api/analytics/v1/jobs/run` | POST | app | cron secret, raw session check | no | yes | review |
| `/api/analytics/v1/opportunities` | GET | app | raw session check | no | yes | review |
| `/api/analytics/v1/overview` | GET | app | raw session check | yes | yes | review |
| `/api/analytics/v1/recent-events` | GET | app | raw session check | no | yes | review |
| `/api/analytics/v1/social` | GET | app | raw session check | yes | yes | review |
| `/api/analytics/v1/time-series` | GET | app | raw session check | yes | yes | review |
| `/api/auth/[...nextauth]` | ? | app | NONE | no | no | review |
| `/api/calendar/book` | POST | app | admin session | no | no | review |
| `/api/calendar/google/callback` | GET | app | raw session check | no | no | review |
| `/api/calendar/google/connect` | GET | app | raw session check | no | no | review |
| `/api/contacts/[id]` | PATCH | app | admin session | no | no | review |
| `/api/content/generate` | POST | app | admin session | yes | yes | review |
| `/api/content/publish` | POST | app | admin session | no | no | review |
| `/api/content/schedule` | POST | app | admin session | no | no | review |
| `/api/dashboard/overview` | GET | app | raw session check | no | yes | review |
| `/api/documents/upload` | POST | app | admin session | no | no | review |
| `/api/gemini/jargon` | POST | app | NONE | no | yes | REVIEW (mutating, unauthenticated) |
| `/api/gemini/legacy-letter` | POST | app | NONE | no | yes | REVIEW (mutating, unauthenticated) |
| `/api/hub-os/generate` | POST | app | admin session | no | no | review |
| `/api/inquiries` | GET | app | raw session check | no | yes | review |
| `/api/inquiries/[id]` | PATCH | app | raw session check | yes | yes | review |
| `/api/internal/contacts` | GET | app | NONE | no | no | review |
| `/api/marketing/assets` | DELETE,GET,POST | app | admin session | no | yes | review |
| `/api/marketing/campaign` | POST | app | admin session | yes | yes | review |
| `/api/marketing/content` | POST | app | admin session | no | no | review |
| `/api/marketing/content/publish` | POST | app | admin session | no | no | review |
| `/api/marketing/publish` | POST | app | admin session | no | no | review |
| `/api/marketing/repository` | GET | app | admin session | no | no | review |
| `/api/marketing/templates` | GET,POST | app | admin session | yes | yes | review |
| `/api/marketing/workflows` | GET,POST | app | admin session | yes | yes | review |
| `/api/marketing/workflows/[id]` | DELETE,GET,PATCH | app | admin session | yes | yes | review |
| `/api/marketing/workflows/[id]/execute` | POST | app | admin session, cron secret | no | no | review |
| `/api/messages/send` | POST | app | admin session | no | no | review |
| `/api/reports/conversions` | GET | app | raw session check | no | yes | review |
| `/api/reports/counties` | GET | app | raw session check | no | yes | review |
| `/api/reports/crm-analytics` | GET | app | raw session check | no | yes | review |
| `/api/reports/ctas` | GET | app | raw session check | no | yes | review |
| `/api/reports/overview` | GET | app | raw session check | no | yes | review |
| `/api/reports/overview-analytics` | GET | app | raw session check | no | yes | review |
| `/api/reports/pages` | GET | app | raw session check | no | yes | review |
| `/api/reports/predictive-insights` | GET | app | raw session check | no | yes | review |
| `/api/reports/recent-events` | GET | app | raw session check | no | yes | review |
| `/api/reports/sources` | GET | app | raw session check | no | yes | review |
| `/api/reports/time-series` | GET | app | raw session check | no | yes | review |
| `/api/reports/weekly` | GET,POST | app | cron secret, raw session check | no | yes | review |
| `/api/reports/weekly/pdf` | GET | app | admin session | no | no | review |
| `/api/social/facebook/callback` | GET | app | NONE | no | no | review |
| `/api/social/facebook/connect` | GET | app | NONE | no | no | review |
| `/api/social/facebook/insights` | GET | app | admin session | no | no | review |
| `/api/social/facebook/publish` | POST | app | admin session | no | no | review |
| `/api/social/facebook/validate` | GET | app | admin session | no | no | review |
| `/api/social/ingest` | POST | app | raw session check | no | no | review |
| `/api/social/linkedin/ingest` | POST | app | signature/HMAC | no | no | review |
| `/api/social/manual-test` | POST | app | admin session | no | no | review |
| `/api/social/metrics` | GET | app | raw session check | no | no | review |
| `/api/social/posts` | GET,POST | app | admin session | no | no | review |
| `/api/social/posts/[id]/publish` | POST | app | admin session | no | no | review |
| `/api/social/publish` | POST | app | admin session | no | no | review |
| `/api/social/templates` | DELETE,GET,PATCH,POST | app | raw session check | no | no | review |
| `/api/social/upload` | POST | app | admin session | no | no | review |
| `/api/tasks` | GET,PATCH,POST | app | raw session check | no | yes | review |
| `/api/workflows/engagement-spike` | POST | app | cron secret | no | no | review |
| `/api/cron/appointment-reminders` | GET | cron | cron secret | no | no | ok |
| `/api/cron/automated-task-generation` | GET | cron | cron secret | no | no | ok |
| `/api/cron/content-publishing` | GET | cron | cron secret | no | no | ok |
| `/api/cron/daily` | GET | cron | cron secret | no | no | ok |
| `/api/cron/daily-brief` | GET | cron | cron secret | no | no | ok |
| `/api/cron/lead-score-updates` | GET | cron | cron secret | no | no | ok |
| `/api/cron/lead-scoring` | GET | cron | cron secret | no | no | ok |
| `/api/cron/notification-checks` | GET,POST | cron | cron secret | no | no | ok |
| `/api/cron/social-publisher` | GET | cron | cron secret | no | no | ok |
| `/api/cron/weekly` | GET | cron | cron secret | no | no | ok |
| `/api/cron/weekly-report` | GET | cron | cron secret | no | no | ok |
| `/api/analytics/event` | POST | public | public (intended) | no | yes | ok |
| `/api/appointments/book` | POST | public | public (intended) | yes | yes | ok |
| `/api/availability` | GET | public | public (intended) | no | no | ok |
| `/api/booking/notify` | ? | public | public (intended) | no | no | ok |
| `/api/card-events` | ? | public | public (intended) | no | no | ok |
| `/api/consultation` | ? | public | public (intended) | yes | yes | ok |
| `/api/event` | ? | public | public (intended) | no | yes | ok |
| `/api/fillout` | ? | public | public (intended) | no | no | ok |
| `/api/health` | GET | public | public (intended) | no | no | ok |
| `/api/join` | POST | public | public (intended) | yes | yes | ok |
| `/api/lead` | ? | public | public (intended) | yes | yes | ok |
| `/api/meta/view-content` | POST | public | public (intended) | no | no | ok |
| `/api/pahs-lead` | POST | public | public (intended) | no | yes | ok |
| `/api/redirect/ethos` | GET | public | public (intended) | yes | yes | ok |
| `/api/calendar/calendly/webhook` | POST | webhook | signature/HMAC | no | no | ok |
| `/api/fillout-webhook` | POST | webhook | NONE | no | yes | BLOCKER (no cron/webhook protection) |
| `/api/social/meta/webhook` | GET,POST | webhook | signature/HMAC | no | no | ok |
| `/api/webhooks/booking` | POST | webhook | signature/HMAC | yes | yes | ok |
| `/api/webhooks/card` | GET,POST | webhook | raw session check | yes | yes | ok |
| `/api/webhooks/fillout` | GET,POST | webhook | signature/HMAC | yes | yes | ok |
| `/api/webhooks/twilio` | POST | webhook | signature/HMAC | no | yes | ok |

## Fixed in this milestone

The following confirmed BLOCKER issues identified during this audit were fixed directly as part of
Milestone 1, since they were anonymous admin mutation routes or a broken auth check:

- `lib/ai/shared.ts` `requireAdminSession()` — `DISABLE_ADMIN_AUTH=true` is now refused at runtime when
  `NODE_ENV=production` (previously bypassed auth unconditionally).
- `app/api/analytics/ga4/data` — fixed broken `instanceof Response` auth check that meant
  `requireAdminSession()` never actually blocked unauthenticated requests; now uses `auth.ok`.
- `app/api/admin/crm`, `app/api/admin/crm/contacts`, `app/api/admin/crm/messages`,
  `app/api/admin/marketing/publisher`, `app/api/admin/marketing/repository`, `app/api/admin/system`
  — added `requireAdminSession()` guards (previously fully anonymous CRUD on Contact/Message/
  ContentResource/SocialPublishJob records).
- `app/api/admin/marketing/publisher/cron` — added `requireCronAuth()`.
- `app/api/content/publish` — added `requireAdminSession()` (admin-triggered publish-now action).
- `app/api/content/schedule` — added `requireAdminSession()`.

## Remaining blockers / review items for Milestone 2+

See rows marked `BLOCKER` or `REVIEW` above. Highest priority for Milestone 2 (admin roles + API guards):

- `/api/gemini/jargon` (POST) — REVIEW (mutating, unauthenticated)
- `/api/gemini/legacy-letter` (POST) — REVIEW (mutating, unauthenticated)
- `/api/fillout-webhook` (POST) — BLOCKER (no cron/webhook protection)

## Notes for Milestone 2/3

- **Duplicate/legacy route groups**: `/api/admin/crm/*` duplicates `/api/contacts`, `/api/inquiries`, and
  `/api/messages/send`; `/api/marketing/*` (content, publish, repository, assets, templates, campaign) is a
  separate, now-protected console alongside `/api/admin/marketing/*` and `/api/content/*`. Per SPEC-1 Phase 8,
  these should be consolidated onto a single canonical path per concern (CRM contacts/messages, and
  `SocialPost`-based publishing) rather than maintained as parallel implementations.
- **`/marketing` page**: `app/marketing/page.tsx` is a full marketing command center (campaign builder, asset
  uploads, templates, publishing) that is *not* under `/admin` and therefore not covered by
  `middleware.ts` (`matcher: ['/admin/:path*']`). Its API routes are now admin-session-gated as part of this
  milestone, so the page itself will redirect to a 401 JSON response for anonymous visitors, but the page
  route itself remains publicly reachable. Milestone 2 should either move this under `/admin/marketing` or
  add an explicit session check in the page/layout.
- **`/api/gemini/jargon` and `/api/gemini/legacy-letter`**: callable anonymously (rate-limited only), consume
  AI provider credits, and have no in-repo callers found. Milestone 2/3 should decide whether these are
  intentionally public tools (and need stronger abuse controls) or dead code to remove.
- All routes in the `app` class still need a Milestone 2 pass to move from ad-hoc `requireAdminSession()` /
  `getServerSession()` checks to role-aware `requireAdminRole([...])` per the Route Protection Matrix in
  SPEC-1.
