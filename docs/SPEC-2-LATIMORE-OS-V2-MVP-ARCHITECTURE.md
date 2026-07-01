# SPEC-2 — Latimore OS v2 MVP Architecture

## Purpose

Latimore OS v2 is the recruiting operating system for Latimore Life & Legacy. The MVP must keep recruiting operations separate from retail/client-facing insurance pages, keep PostgreSQL as the reporting truth, and make AI/content workflows governed instead of auto-publishing.

## MVP implementation order

### Phase 0 — Buildable baseline

- Keep `package-lock.json` committed and use `npm ci` in deployment.
- Validate required production environment variables before runtime secrets are needed.
- Keep Prisma migrations committed; do not rely on production `prisma db push`.
- Keep seed data idempotent and safe to rerun.

### Phase 1 — Admin authentication and RBAC

- `/admin/*` must require a valid session.
- `/login` must be the user-facing login page.
- Production must not allow `DISABLE_ADMIN_AUTH=true`.
- Roles should be enforced at every admin mutation boundary:
  - `ADMIN`: full access.
  - `REVIEWER`: review and approval workflows.
  - `AGENT`: CRM updates for assigned leads; no approval or publishing authority.

### Phase 2 — Public lead capture and tracking

- `POST /api/leads` is the canonical public lead-intake endpoint.
- The endpoint must validate lead payloads, rate-limit submissions, reject honeypot spam, merge duplicate contacts by normalized email before phone, create an inquiry, create a follow-up task, record a `form_submit` event, calculate an initial lead score, and write an audit-style system event.
- Tracking redirects should classify likely bots and append UTM values to destination URLs before redirecting.

### Phase 3 — CRM operations

- Admin/Agent users must be able to move stages, add interactions, create tasks, and complete tasks from the UI.
- Every mutation should write an audit event or `SystemEvent` equivalent.
- Lead score should be recalculated after material updates.

### Phase 4 — Knowledge governance

- Uploads must be private and reviewed before being used by Composer.
- Assets should move through `PENDING → PROCESSING → REVIEW → APPROVED_* / RESTRICTED / ARCHIVED`.
- Composer may use only approved knowledge assets.

### Phase 5 — Composer compliance

- AI output remains draft-only.
- Draft approval must be blocked server-side when publishable content lacks campaign/UTM governance, tracking links, required citations, or includes raw outbound URLs or banned claims.
- Only Reviewer/Admin roles may approve governed content.

### Phase 6 — Analytics truth

- Analytics screens must read from PostgreSQL tables and rollups, not live provider dashboards.
- Bot clicks should remain stored but be excluded from rollups.
- Source-health jobs should mark integrations as `healthy`, `degraded`, `not_configured`, or `error`.

## MVP Contractor Handoff Milestones

This section is confirmed as the delivery plan for the MVP contractor handoff. It reconciles the current app contract with the hardening path: stabilize first, then complete RBAC, lead intake, CRM auditability, tracking redirects, knowledge governance, Composer approval, analytics rollups, and production readiness.

### M0 — Baseline Stabilization

**Goal:** Confirm the existing app can be safely built, tested, and deployed.

**Deliverables:**

- Production `.env` validation completed.
- `npm run lint` passes.
- `npm run typecheck` passes.
- `npm run build` passes.
- Prisma client generation and migration flow verified.
- Existing canonical docs reviewed:
  - `README.md`
  - `SYSTEM_CONTRACT.md`
  - `SPEC-HARDENING.md`

**Acceptance criteria:** Contractor can clone the repo, configure env vars, run the app locally, and build without undocumented fixes.

### M1 — Admin Authentication and RBAC

**Goal:** Replace loose admin access with explicit role-based permissions.

**Deliverables:**

- `AdminUser` / role model added.
- RBAC helper added, for example `lib/rbac.ts`.
- Admin-only routes protected by role checks.
- Production blocks `DISABLE_ADMIN_AUTH=true`.

**Acceptance criteria:**

- Admin users can access all admin tools.
- Reviewers can approve/review but not manage system config.
- Agents can view CRM work queues but cannot approve publishing or modify admin settings.

### M2 — Lead Intake Consolidation

**Goal:** Make lead capture predictable and auditable.

**Deliverables:**

- One canonical public lead endpoint selected.
- Legacy duplicate lead endpoints wrapped or deprecated.
- All public forms route to the canonical endpoint.
- Fillout webhook no longer creates duplicate submit events.
- Lead dedupe tests added for email and phone.

**Acceptance criteria:**

- A form submit creates or updates exactly one `Contact`.
- A matching `Inquiry`, `Task`, `Event`, and `SystemEvent` are created.
- Duplicate submissions update the existing contact instead of creating bad duplicates.

### M3 — CRM Route Consolidation

**Goal:** Ensure CRM state is stored through Prisma and auditable events.

**Deliverables:**

- Task APIs use Prisma `Task`.
- Stage changes use the canonical stage-change service.
- Notes, interactions, tasks, and stage transitions write `SystemEvent`.
- Lead score recalculation is triggered after meaningful CRM actions.

**Acceptance criteria:**

- Admin CRM UI reads and writes from one canonical data model.
- Every meaningful CRM mutation has an audit trail.
- Contractors do not need to guess between Supabase-table routes and Prisma routes.

### M4 — Tracking Redirects

**Goal:** Add governed campaign tracking links.

**Deliverables:**

- `TrackingLink` model added.
- `TrackingClick` model added.
- `GET /api/redirect/[id]` implemented.
- Bot classification applied.
- UTM parameters appended consistently.
- Bot clicks excluded from analytics rollups.

**Acceptance criteria:**

- QR codes, social links, GBP links, and campaign links can use managed redirect IDs.
- Every click is stored.
- Analytics separate real user traffic from likely bots.

### M5 — Knowledge Governance

**Goal:** Prevent unreviewed uploaded content from being used by AI or public publishing.

**Deliverables:**

- Knowledge asset status workflow added:
  - `PENDING`
  - `PROCESSING`
  - `REVIEW`
  - `APPROVED_PUBLIC`
  - `APPROVED_INTERNAL`
  - `RESTRICTED`
  - `ARCHIVED`
- Reviewer metadata added.
- Approval UI added under admin.
- AI routes limited to approved assets.

**Acceptance criteria:**

- Uploaded documents are not automatically trusted.
- AI content generation can only use approved knowledge.
- Admins can see who approved an asset and when.

### M6 — Composer Approval and Publishing Controls

**Goal:** Make AI-generated content draft-only until approved.

**Deliverables:**

- Content approval endpoint added.
- Compliance checks enforced before approval.
- Publishing endpoint only allows approved or scheduled content.
- Raw outbound URLs blocked unless tracking/UTM rules pass.
- Claims requiring support require citations or approved source references.

**Acceptance criteria:**

- AI cannot directly publish public-facing content.
- Reviewer/admin approval is required.
- Failed compliance checks block approval.

### M7 — Analytics Rollups and Source Health

**Goal:** Create reliable production reporting.

**Deliverables:**

- Cron-based analytics aggregation configured.
- Daily metrics roll up from raw events.
- Source/campaign breakdowns implemented.
- Bot traffic excluded.
- Integration health checks added for:
  - GA4
  - Google Calendar
  - Resend
  - Google Chat
  - Fillout
  - Social publishers

**Acceptance criteria:**

- Dashboard numbers come from stable analytics tables.
- Raw events remain available for audit.
- Admin can identify broken integrations quickly.

### M8 — Production Readiness

**Goal:** Prepare the MVP for contractor handoff and launch.

**Deliverables:**

- Smoke-test checklist completed.
- Admin workflow tested end-to-end.
- Public funnel tested end-to-end.
- Booking and notification flow tested.
- Deployment guide updated.
- Rollback steps documented.

**Acceptance criteria:**

- A visitor can submit a lead.
- The lead appears in admin CRM.
- A task is created.
- Admin can update stage and notes.
- Content can be drafted, reviewed, approved, and published.
- Analytics reflect the activity within the expected rollup window.

## Current MVP bridge implemented in this change

- Added a canonical `POST /api/leads` route for validated, rate-limited lead intake.
- Added deterministic lead scoring for the current `Contact` + `Inquiry` schema.
- Updated lead creation to record a `form_submit` event and a `lead.audit.created` system event.
- Added tracking utility modules for bot-click classification and UTM URL building so the redirect work can be wired without duplicating logic.

## Launch checklist

- [ ] `npm run build` passes.
- [ ] `npx prisma migrate deploy` succeeds.
- [ ] Seed can run twice without duplicate demo data.
- [ ] `/admin/*` redirects unauthenticated users to login.
- [ ] Public lead forms create contact, inquiry, task, event, audit record, and score.
- [ ] Tracking redirect records clicks and preserves UTM attribution.
- [ ] Agent role cannot approve knowledge or Composer drafts.
- [ ] Reviewer/Admin can approve after compliance checks pass.
- [ ] Analytics renders from database-backed events/rollups.
