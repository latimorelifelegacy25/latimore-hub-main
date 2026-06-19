# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev           # Start Next.js dev server (localhost:3000)
npm run build         # prisma generate + next build
npm run lint          # ESLint
npm run validate      # lint + build (pre-deploy check)
npm run check         # TypeScript type-check only (tsc --noEmit)
npm run analytics:validate  # Validate analytics data integrity

# Database
npm run db:deploy     # prisma migrate deploy (production)
npm run db:push       # prisma db push (schema sync, dev only)
npm run db:seed       # seed test data via prisma/seed.ts
```

No test suite is configured. `npm run validate` is the closest to a CI gate.

## Tech Stack

- **Next.js 15.2** with App Router, React 18, TypeScript 5.4
- **Prisma 5.22** ORM + **Supabase** PostgreSQL
- **NextAuth 4.24** (Google OAuth)
- **Tailwind CSS 3.4** with custom brand design tokens
- **Resend** (email), **Twilio** (SMS), **OpenAI / Gemini** (AI)
- **Vercel** (hosting + cron jobs)

## Directory Structure

```
app/               # Next.js App Router — pages and API routes
  _components/     # Shared layout components (site-shell, public-tracker)
  admin/           # Protected admin dashboard (CRM, analytics, content, AI)
  api/             # ~140 API route handlers
  (public pages)   # about, blog, contact, services, pahs, legal, etc.
components/        # Reusable React components
  admin/           # Admin-only UI components
  blog/            # Blog article components
  booking/         # Booking flow components
  nexus/           # Nexus AI platform components
lib/               # All shared business logic and utilities
  ai/              # AI provider abstraction, lead scoring, sentiment
  analytics/       # GA4, engagement metrics, aggregation, spike detection
  hub/             # Core CRM service layer (upsert-lead, ingest-event, etc.)
  social/          # Facebook, LinkedIn, Meta API integrations
  calendar/        # Google Calendar availability/slots
  reports/         # PDF generation, weekly report compilation
  notion/          # Notion API client and contact sync
  documents/       # Document upload and extraction
  tracking/        # Session inference and dashboard event tracking
prisma/            # Schema, migrations, seed data
content/           # MDX blog posts (28 articles) and asset sets
emails/            # React Email templates (notification, thank-you, launch)
agents/            # Python automation agent
mcp/               # Model Context Protocol server (excluded from TS build)
workflows/         # Workflow definitions
scripts/           # validate-analytics.ts, verify-workspace.ts
public/            # Static assets (brand images, PAHS assets, manifest.json)
```

## Architecture

### Data flow

Every user interaction funnels through two primary server endpoints:

- `POST /api/event` — analytics (page views, CTA clicks, form submits, etc.)
- `POST /api/lead` — lead capture (requires email or phone)

Webhook adapters (`/api/webhooks/fillout`, `/api/webhooks/booking`, `/api/webhooks/card`) and the legacy `/api/fillout` route normalize third-party payloads into the same service-layer functions.

### Service layer (`lib/hub/`)

All CRM business logic lives here, called only by API routes — never directly from pages:

| File | Purpose |
|------|---------|
| `upsert-lead.ts` | Upsert Contact + create Inquiry + auto-create follow-up Task + fire `lead_created` event |
| `ingest-event.ts` | Upsert LeadSession + write Event row |
| `extract-attribution.ts` | Parse UTM params and referrer from request headers |
| `automation-rules.ts` | Rules engine — evaluate and trigger automated actions on leads |
| `change-stage.ts` | Update Inquiry stage + write InquiryStageHistory + fire `stage_changed` event |
| `record-appointment.ts` | Create Appointment record |
| `post-service.ts` | Social post creation and scheduling |
| `reporting.ts` | Report generation helpers |
| `normalizers.ts` | `normalizeStage`, `normalizeProductInterest`, `normalizeEventType`, `cleanString` — sanitize and map all external strings |

### Database (Prisma + Supabase PostgreSQL)

Two connection URLs required: `DATABASE_URL` (port 6543, pooled) for runtime queries, `DIRECT_URL` (port 5432) for migrations.

**Core data model:**
```
LeadSession → Contact → Inquiry → Event
                              → InquiryStageHistory (full audit trail)
                              → Task
                              → Note
                              → Appointment
```

**Key enums:**
- `PipelineStage` — New, Attempted_Contact, Qualified, Booked, Sold, Follow_Up, Lost
- `ProductInterest` — Mortgage_Protection, Final_Expense, Term_Life, Whole_Life, IUL, Annuity, etc.
- `EventType` — page_view, cta_click, form_submit, lead_created, stage_changed, etc.
- `LeadSource` — WEBSITE_DIRECT, GOOGLE_ADS, SOCIAL_ORGANIC, QR_CAMPAIGN, etc.
- `LeadIntent` — CONSULT, JOIN_PARTNERSHIP, JOIN_AGENT, etc.
- `LeadStatus` — NEW, ATTEMPTED_CONTACT, CONTACTED, QUALIFIED, BOOKED, etc.
- `SocialProvider` — linkedin, facebook, instagram, twitter
- `AiRunType` — daily_brief, draft_message, contact_brief, lead_score, content_generation

**Additional model groups:**
- Communication: `ConversationThread`, `ConversationMessage`, `EmailLog`
- Calendar: `Appointment`, `CalendarEvent`, `CalendarConnection` (encrypted OAuth tokens)
- Content: `ContentAsset`, `Post`, `SocialPost`, `SocialAccount`, `SocialConnection`, `SocialTemplate`
- Analytics: `AnalyticsDailyMetric`, `AnalyticsBreakdownDaily`, `AnalyticsFunnelDaily`, `AnalyticsTarget`, `WeeklyReport`
- AI: `AiRun`, `AutomationRule`, `WorkflowTemplate`, `WorkflowStep`, `Insight`

### Client-side tracking

`PublicTracker` (`app/_components/public-tracker.tsx`, mounted in `app/layout.tsx`) auto-fires `page_view` on route change and captures `cta_click`, `call_click`, `book_click`, etc. via a delegated click listener. It infers `productInterest` and `county` from element text, href, and `data-product-interest` / `data-county` attributes. Tracking failures are silently swallowed.

### Auth & protection

`middleware.ts` uses `next-auth/middleware` to guard all `/admin/*` routes. Google OAuth is configured in `lib/auth.ts`. Admin emails are controlled by the `ADMIN_EMAILS` env var (comma-separated). All protected API routes call `requireAdminSession()` from `lib/ai/shared.ts`. Set `DISABLE_ADMIN_AUTH=true` to bypass auth in local development.

### AI layer (`lib/ai/`)

`lib/ai/client.ts` exposes `createOpenAIJsonCompletion` — dispatches to OpenAI (default, `gpt-4.1-mini`) or Gemini based on `AI_PROVIDER` env var. Model routing variants in `model-router.ts` (quality) and `cheap-model-router.ts` (cost-optimized). All AI routes log runs to the `AiRun` table and support dual auth: admin session **or** `x-cron-secret` header for scheduled jobs.

Key AI capabilities:
- Lead scoring (`lead-score.ts`, `lead-score-enhanced.ts`) — scored 0–100, triggered by `lead-score-trigger.ts`
- Sentiment analysis (`sentiment.ts`) on form submissions and messages
- Contact context builder (`contact-context.ts`) — assembles full contact history for AI prompts
- Daily brief generation, draft message creation, contact intelligence briefs

### Analytics stack

- **GA4** — `lib/analytics/ga4.ts`, multi-ID support, OAuth connection stored via `CalendarConnection`
- **Custom internal analytics** — daily/weekly aggregation jobs write to `AnalyticsDailyMetric`, `AnalyticsBreakdownDaily`, `AnalyticsFunnelDaily`
- **Spike detection** — `lib/analytics/spike-detection.ts` identifies anomalies in metric time series
- **Export** — `lib/analytics/export.ts` for data downloads
- Routes under `/api/analytics/v1/*` serve funnel, breakdown, and export data to the admin dashboard

### Social integrations (`lib/social/`)

OAuth tokens for Facebook/LinkedIn stored encrypted in `SocialConnection`. Key modules:
- `facebook-oauth.ts` — OAuth flow, page token exchange
- `meta.ts` — Facebook/Instagram Graph API (insights, posting)
- `linkedin.ts` — LinkedIn organic posting and data ingest
- `upsert-social-lead.ts` — convert social form submissions into Contacts

### Email & notifications

`lib/mailer.ts` uses Resend. `lib/notifications.ts` sends admin alerts on new leads. `emails/templates.ts` defines React Email templates (notifications, thank-you, launch emails).

### Cron jobs (Vercel, 13:00 UTC daily)

| Route | Purpose |
|-------|---------|
| `/api/cron/daily` | Master daily job (fires daily brief, runs aggregations) |
| `/api/cron/weekly` | Weekly report compilation and delivery |
| `/api/cron/lead-score-updates` | Batch re-score stale leads |
| `/api/cron/appointment-reminders` | SMS/email reminders before appointments |
| `/api/cron/automated-task-generation` | Create follow-up tasks from automation rules |
| `/api/cron/content-publishing` | Publish scheduled social posts |

### API conventions

- Every route file that must not be statically cached declares `export const dynamic = 'force-dynamic'` at the top.
- All POST body validation uses Zod schemas from `lib/schemas.ts` via `.safeParse()`.
- Rate limiting uses `lib/rate-limit.ts` (Upstash Redis) keyed by IP — separate limits per route type (`fillout`, `inquiries`, `booking`, `reports`).
- Fillout webhook verifies HMAC-SHA256 signatures from `FILLOUT_SECRET` before processing.
- OAuth tokens stored encrypted at rest via AES-256-GCM in `lib/crypto.ts`.

### Public pages

Main public routes: `/` (landing), `/about`, `/services`, `/products`, `/contact`, `/blog/[slug]`, `/education`, `/marketing`, `/join`, `/book`, `/pahs` (+ `/pahs/form`, `/pahs/start`), `/schuylkill`, `/legal/privacy`, `/legal/terms`, `/legal/disclosures`.

### Admin dashboard (`/admin/*`)

Protected by Google OAuth. Key areas:
- **CRM** — `/admin/crm/hub`, `/admin/contacts`, `/admin/inbox`, `/admin/tasks`, `/admin/pipeline`
- **AI** — `/admin/nexus-agent` (copilot), `/admin/autonomous-monitor`, `/admin/ai-advisor`
- **Social OS** — `/admin/social-os` (full social media management)
- **Content** — `/admin/content/*` (creator, calendar, scheduler, campaigns)
- **Analytics** — `/admin/master-dashboard`, `/admin/dashboard`, `/admin/analytics`, `/admin/reports`, `/admin/funnels`
- **Settings** — `/admin/connectors` (social/calendar OAuth), `/admin/settings/*`
- **Other** — `/admin/annuity-platform`, `/admin/workflow`, `/admin/vault`, `/admin/links`, `/admin/pahs-campaign`

### Brand constants (`lib/brand.ts`)

- Colors: Navy `#0E1A2B`, Gold `#C9A25F`, Gold Light `#E5C882`
- Service area: Schuylkill, Luzerne, Northumberland Counties, PA
- Founder: Jackson M. Latimore Sr.
- Phone: 717-615-2613

## Key env vars

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Supabase pooled (port 6543) |
| `DIRECT_URL` | Supabase direct (port 5432, migrations) |
| `NEXTAUTH_SECRET` | NextAuth session signing key |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth for admin login |
| `ADMIN_EMAILS` | Comma-separated list of allowed admin Google accounts |
| `DISABLE_ADMIN_AUTH` | Set `true` to bypass auth in local dev |
| `FILLOUT_SECRET` | Webhook HMAC secret |
| `RESEND_API_KEY` | Transactional email |
| `NOTIFY_TO` / `THANKYOU_FROM` | Email addresses for lead notifications |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_PHONE_NUMBER` | SMS |
| `AI_PROVIDER` | `openai` (default) or `gemini` |
| `OPENAI_API_KEY` / `GEMINI_API_KEY` | Required for AI features |
| `CRON_SECRET` | Allows cron jobs to call AI routes without an admin session |
| `NEXT_PUBLIC_BASE_URL` | Canonical domain for metadata/OG tags |
| `NEXT_PUBLIC_GA4_ID` | Optional GA4 measurement ID |
| `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` | Facebook/Instagram OAuth |
| `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET` | LinkedIn OAuth |
| `TOKEN_ENCRYPTION_KEY` | AES-256-GCM key for OAuth token storage |
| `NOTION_TOKEN` / `NOTION_PAGE_ID` | Notion sync (GitHub Action) |

## CI/CD

- **Vercel** hosts the app; `next build` runs on every push. Build fails on TypeScript errors or ESLint violations.
- **Cron** configured in `vercel.json`: `/api/cron/daily` at `0 13 * * *` UTC.
- **GitHub Actions** (`.github/workflows/sync-readme-to-notion.yml`): syncs README.md to Notion on push to main.
- No automated test suite. `npm run validate` (lint + build) is the pre-deploy gate.
