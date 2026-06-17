# Security & Platform Governance Findings

Audit pass over admin authorization, Supabase RLS, PII-safe logging, API
rate limiting, and static asset performance. Each section states what was
found, what was changed, and what was deliberately left for a follow-up PR.

## 1. Admin authorization enforcement

**Finding: the real enforcement boundary is sound.** `middleware.ts` gates
every `/admin/*`, `/dashboard/*`, `/crm/*`, `/leads/*`, and the listed
`/api/*` prefixes (`/api/admin`, `/api/ai`, `/api/analytics/v1`,
`/api/contacts`, `/api/reports`, etc.) by decoding the NextAuth JWT and
checking `isAdminEmail()` against `ADMIN_EMAILS` — this runs before any
route handler executes, and fails closed (401/403/404) if the token is
missing or the email isn't allow-listed. `DISABLE_ADMIN_AUTH=true` is
explicitly forbidden in production by both `middleware.ts` and the startup
gate in `lib/env.ts`.

Most route handlers add a second, redundant check via `requireAdminSession()`
(`lib/ai/shared.ts`) or the equivalent `requireAdmin()` (`lib/require-admin.ts`).
Because the NextAuth `signIn` callback (`lib/auth.ts`) already rejects
non-admin emails at sign-in, any session that exists is by construction an
admin session — so a bare `if (!session)` check is not a weaker check than
an explicit email allowlist check, just a differently-shaped one.

**Fixed in this PR:**
- `app/api/admin/insights/route.ts` called `getServerSession()` directly
  instead of the shared `requireAdminSession()` helper. Functional bug: it
  didn't honor `DISABLE_ADMIN_AUTH=true`, so this one endpoint was broken in
  local dev even with the documented bypass flag set. Switched to the shared
  helper.
- `/api/social/ingest` had its own inline session check but, unlike its
  sibling `/api/social/*` routes, was missing from `middleware.ts`'s
  protected-prefix list — so it had no defense-in-depth layer if its own
  check were ever changed. Added it to both the `protectedPrefixes` array
  and the route `matcher` config.

**Noted, not changed:** `app/api/admin/marketing/publisher/cron/route.ts`
uses a cron-secret check (`requireCronAuth`) but lives under `/api/admin/*`,
which `middleware.ts` gates with an admin-session requirement first. A real
cron job (no browser session) can never pass that gate, so this route's own
auth path is effectively unreachable dead code today — it isn't registered
in `vercel.json`'s `crons` list either. This fails closed (more restrictive,
not less), so it isn't a vulnerability, but it's worth knowing the route
doesn't currently do what its code implies. Left untouched pending a decision
on whether it should be wired into a cron schedule or removed.

There are ~30 other routes that duplicate the inline
`getServerSession(authOptions); if (!session) ...` pattern instead of
importing `requireAdminSession()`/`requireAdmin()`. All of them sit behind
the middleware gate already, so this is a consistency/maintainability issue,
not a security gap — flagging it here rather than rewriting ~30 files in one
pass given there's no test suite to catch a mistake. Worth consolidating
opportunistically as those files are touched for other reasons.

## 2. Supabase RLS audit

**Finding: RLS was off on every table, and that mattered more than it
looked like.** This app never queries Postgres as the Supabase `anon` or
`authenticated` role — Prisma uses `DATABASE_URL`/`DIRECT_URL` with a role
that has `BYPASSRLS`, and the handful of raw `supabase-js` calls
(`lib/automation/crm.ts`, `lib/virtual-intake.ts`, `app/api/pahs-lead`,
`app/api/tasks`, `app/api/social/upload`, `app/api/fillout-webhook`,
`app/api/webhooks/card`, `app/api/analytics/event`) all use
`SUPABASE_SERVICE_ROLE_KEY`, which also bypasses RLS. So RLS being off
never weakened the app's own request path.

But `NEXT_PUBLIC_SUPABASE_ANON_KEY` is a required production env var
(`lib/env.ts`) and, by Supabase's design, isn't meant to be a secret — RLS is
the *only* thing that decides what that key can do against Supabase's
auto-generated PostgREST REST/GraphQL API. With RLS off, anyone holding that
key could call `<project>.supabase.co/rest/v1/Contact?select=*` (or
`Inquiry`, `Event`, `AiRun`, etc.) directly and read or write every row,
completely bypassing Next.js middleware, NextAuth, and Prisma.

**Fixed in this PR:** migration
`prisma/migrations/20260617000000_enable_row_level_security/migration.sql`
enables RLS on all 41 application tables with no policies defined, which
makes them default-deny for `anon`/`authenticated` while leaving the
service-role/BYPASSRLS-based app traffic completely unaffected. Apply via
the normal `npm run db:deploy` flow described in
`docs/rollback-playbook.md`.

If any future feature needs the browser to talk to Supabase directly with
the anon key (instead of going through a Next.js API route), it will need
explicit `CREATE POLICY` statements scoped to that use case — don't widen
this migration's blanket deny without adding matching policies.

## 3. PII-safe logging

**Finding:** `lib/logger.ts` had no redaction. Most server logging already
flows through it, but several call sites pass through loosely-typed objects
that can carry contact PII — e.g. `lib/notifications.ts` logging full
`notification` payloads, `lib/hub/automation-rules.ts` logging
`action.payload`, `lib/ai/shared.ts` logging system-event `input`.

**Fixed in this PR:** `lib/logger.ts` now wraps every level
(`info`/`warn`/`error`/`debug`/`fatal`/`trace`) with a recursive scrubber
that redacts known PII field names (`email`, `phone`, `address`, `notes`,
`ssn`, `dob`, etc., matched by exact key, case-insensitive, at any nesting
depth up to 6 levels) to `[REDACTED]` before the payload reaches pino. This
is a single chokepoint fix — no call sites needed to change.

One deliberate exception: `lib/auth.ts`'s sign-in audit log now reads
`attemptedEmail` instead of `email` so the redaction doesn't strip it — that
log is the access-control audit trail (which Google account tried to reach
`/admin`), not customer data, and losing it would remove the only signal
for detecting unauthorized access attempts.

**Not changed:** ~40 `console.error(...)` call sites across `app/api/**`
and `lib/**` that log raw `Error` objects on failure paths. These mostly log
error messages/stack traces, not request bodies, so the PII exposure surface
is smaller and indirect (e.g. a Postgres constraint-violation message that
happens to echo a value). Routing all of them through `logger` so they pick
up the same redaction is a reasonable follow-up, but it's a ~40-file
mechanical change with real regression risk in a codebase with no test
suite, for a comparatively low-severity gap — left for a separate, focused
pass.

## 4. API rate limiting

`lib/rate-limit.ts` (Upstash-backed with an in-memory fallback) is already
applied to ~50 routes. Two externally-reachable ingestion endpoints had
secret/signature-based auth but no rate limit at all:

- `app/api/social/linkedin/ingest/route.ts` (bearer-token bridge)
- `app/api/social/meta/webhook/route.ts` (HMAC-signed webhook)

Both now call `rateLimit(req, 'default')` before doing any work — this
doesn't change the security model (an attacker still can't get past the
token/signature check) but bounds retry storms and brute-force attempts
against the secret itself.

## 5. Static asset performance

`next.config.js` already has `images.formats: ['image/avif', 'image/webp']`
and custom `deviceSizes` configured, but only a handful of routes import
`next/image` — most PAHS campaign images (`pahs-2005-allarea.png` at 2.2MB,
`pahs-sponsor-flyer.png` at 1.6MB, `pahs-protect-go.png` at 1.4MB) are plain
`<img>` tags on the public, high-traffic `/pahs` page, fully unoptimized.

**Fixed in this PR (small, safe subset):** added `loading="lazy"
decoding="async"` to the three below-the-fold images on `/pahs`
(sponsor flyer, throwback story photo, footer CTA), leaving the
above-the-fold hero card image untouched so it isn't deprioritized as the
likely LCP element.

**Deliberately deferred:** migrating these `<img>` tags to `next/image`
(which would also resize and re-encode to avif/webp on the fly) is the
bigger win, but it changes rendered markup on a live, revenue-driving
campaign page, and this environment has no way to load the page in a
browser to verify layout before shipping. Doing that migration blind isn't
worth the risk — recommend doing it as its own PR with a Vercel preview
checked visually before merge. `app/pahs/v2/*` (the variant/test version of
this page) was left untouched entirely for the same reason.

## Explicitly deferred (not attempted this round)

- **Funnel session recovery** — would need a defined reattachment strategy
  for lost/expired `LeadSession` rows; touches the core tracking write path
  used by every page view. Architectural decision needed before
  implementation, not a mechanical fix.
- **Lead scoring framework** — current scoring (`lib/ai/lead-score.ts`,
  `lead-score-enhanced.ts`) is hardcoded with no score-history or audit
  table. A real framework (rule versioning, history, backtesting) is a
  multi-file schema change, not a lean fix.
- **CRM archival and retention strategy** — needs new schema fields
  (soft-delete/archived-at) plus a cron job and a decision on retention
  windows per data type. Schema migration + cron, deferred pending a
  decision on retention policy itself.

These match the same bar used for the previous audit batch (PR #187):
ship what's lean and verifiable without a test suite, document the rest
as findings rather than rushing a schema change or a wide mechanical
refactor.
