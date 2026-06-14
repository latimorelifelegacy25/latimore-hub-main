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
