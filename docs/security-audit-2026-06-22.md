# Security Audit — 2026-06-22

This audit replaces a generic, non-codebase-specific checklist with verified
findings against the actual code. It builds on the prior audit trail in
`docs/security-architecture.md`, `docs/api-route-inventory.md`, and
`docs/fix-log.md` — re-checking what those docs claim against current
`main`, since some entries had drifted from the code.

## Summary

Most of the standard "Next.js + Supabase" risk list (service-role key
exposure, missing RLS, unsigned webhooks, no rate limiting, secrets in git)
was already addressed in earlier passes. This pass found two stale doc
entries (already fixed in code, doc not updated), one real behavior change
that weakened a previous fix, and two genuinely open items.

## Verified fixed (doc said open/unclear, code says otherwise)

- **`/api/fillout-webhook`** — `docs/api-route-inventory.md` marks this
  `BLOCKER (no cron/webhook protection)`. Current code
  (`app/api/fillout-webhook/route.ts`) is a 7-line re-export of the signed,
  HMAC-verified canonical handler at `app/api/webhooks/fillout/route.ts`.
  Not a blocker — the inventory table is stale.
- **`/api/internal/contacts`** — inventory marks `NONE` for protection.
  Current code (`app/api/internal/contacts/route.ts:9-17`) requires
  `x-internal-secret` to match `INTERNAL_API_SECRET` via
  `crypto.timingSafeEqual`, returns 401 otherwise. Not a blocker — also stale.

## Real regression: env validation no longer fails closed

`docs/fix-log.md` (P0-1) claims `validateEnv()` is wired into
`instrumentation.ts` "so a misconfigured deploy throws on boot." That was
true as of commit `4b9138d`, but a later commit, `5a34b7f` ("Stop env
validation from crashing all routes"), changed both `instrumentation.ts`
and `lib/env.ts` to catch the error and only `logger.error(...)` it —
intentionally, to stop one missing var from taking down every route on a
serverless cold start. The trade-off is real but the fix-log entry is now
inaccurate: a production deploy missing `SUPABASE_SERVICE_ROLE_KEY`,
`RESEND_API_KEY`, or `GOOGLE_CHAT_WEBHOOK_URL` today **boots successfully**
and silently drops leads/notifications at runtime, surfaced only via a log
line — which is the exact P0-1 failure mode the original fix was written to
prevent.

This isn't a vulnerability (no unauthorized access), but it is a
reliability regression worth a deliberate decision rather than leaving the
docs and code disagreeing:
- If a startup alert (e.g. piping `logger.error` output to an existing
  on-call channel) already covers this, document that instead of the stale
  "throws on boot" claim.
- If not, consider failing closed again for the lead-pipeline vars
  specifically, while keeping the broad try/catch for anything non-critical.

Separately, `lib/env.ts`'s `REQUIRED_IN_PRODUCTION` does not include
`UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`, despite `fix-log.md`'s
"2026-06-17 Incremental Audit Patch" entry claiming they were added — the
code has an explicit comment saying they're "intentionally NOT required."
Whether or not that's the right call (rate-limit degrades to in-memory
fallback rather than breaking outright), the fix-log entry should be
corrected or the code should be reconciled with it.

## Genuinely open items

1. **`/api/gemini/jargon` and `/api/gemini/legacy-letter` are public,
   unauthenticated, AI-credit-consuming endpoints.** Confirmed live call
   sites in `app/layout.tsx`, `app/about/page.tsx`, and
   `app/education/blog/page.tsx` (legitimate public widgets — a jargon
   translator and a legacy-letter generator), so these aren't dead code to
   remove as `docs/api-route-inventory.md` speculated. They're rate-limited
   at the generic `default` tier (100 req/min per IP via
   `lib/rate-limit.ts`), with no per-route cost ceiling. An IP-rotating
   script can still run sustained OpenAI/Gemini completions against your
   API key indefinitely. Recommend a tighter per-route limit (these don't
   need 100/min) and/or a daily spend ceiling check before calling
   `createTextCompletion`.

2. **OAuth token encryption silently no-ops without `TOKEN_ENCRYPTION_KEY`.**
   `lib/crypto.ts:41-51` returns the plaintext token unchanged if the env
   var is unset — by design, for backward compatibility — but
   `TOKEN_ENCRYPTION_KEY` isn't in `lib/env.ts`'s `EnvSchema` at all, so
   there's no startup signal (not even the soft `logger.error` the other
   required vars get) if it's missing in production while
   `SocialConnection`/`CalendarConnection` rows are being written. Add it to
   `EnvSchema` and log loudly (consistent with the other vars) if a
   social/calendar connect flow runs without it configured.

## Re-verified and still sound (no action needed)

- **Admin auth boundary** (`middleware.ts` + `lib/admin-access.ts` +
  `lib/auth.ts`): JWT decode → `isAdminEmail()` allowlist check, runs before
  route handlers, fails closed (401/403/404). `isAdminEmail` returns `false`
  outright if `ADMIN_EMAILS` is empty — no "allow everyone if unconfigured"
  failure mode. `DISABLE_ADMIN_AUTH=true` is explicitly rejected in
  production by `middleware.ts:131-136`.
- **RLS migration exists and is correctly scoped**
  (`prisma/migrations/20260617000000_enable_row_level_security/migration.sql`):
  enables RLS with no policies (default-deny for `anon`/`authenticated`) on
  all 41 tables. `NEXT_PUBLIC_SUPABASE_ANON_KEY` is referenced only inside
  `lib/env.ts`'s schema — grepped the full `.ts`/`.tsx` tree and found no
  client-side usage that would call Supabase's PostgREST API directly with
  it, so this migration's blanket deny doesn't break anything live today.
  **Not verified in this pass:** whether the migration has actually been
  *applied* to the production database (`npm run db:deploy`) — that
  requires DB access this session doesn't have.
- **Webhook signature verification** (`app/api/webhooks/fillout/route.ts`):
  HMAC-SHA256 over the raw body, `crypto.timingSafeEqual` for comparison,
  rejects if `FILLOUT_SECRET` is unset (fails closed, doesn't default-allow).
- **Rate limiting** (`lib/rate-limit.ts`): Upstash-backed with per-route
  limits; in production, an Upstash failure or missing config returns
  "limited" (fails closed) rather than allowing the request through —
  confirmed via `isProduction()` fallback in `upstashLimit()`.
- **No secrets committed.** `.gitignore` excludes all `.env*` variants;
  `git ls-files` shows only `.env.example`/`.env.local.example` tracked, and
  both contain placeholder values only (`sk-...`, `AIza...`,
  `your-fillout-webhook-secret`, etc.) — no live keys. A repo-wide grep for
  common live-key patterns (`sk-`, `AIza`, `AKIA`, Slack tokens, PEM private
  key headers) across all tracked files returned zero matches.
- **Dependency audit**: `npm audit --omit=dev` reports 8 moderate, 0
  high/critical vulnerabilities, all transitive (`next` → `postcss`;
  `gray-matter` → `js-yaml`), none with a non-major-version fix available
  today. Low urgency; revisit when `next` ships a patch release that pulls
  in a fixed `postcss`.
- **PII-redacting logger** (`lib/logger.ts`): wraps all log levels with a
  recursive scrubber for known PII field names; `lib/auth.ts`'s sign-in
  audit trail deliberately uses `attemptedEmail` (not `email`) to survive
  redaction since it's an access-control log, not customer data.

## What this pass did not (re-)verify

- Whether the RLS migration has been deployed to the live Supabase project.
- Browser-side behavior (no environment to load the app in this session).
- The ~30 routes `docs/security-architecture.md` flagged as using the
  inline `getServerSession()` pattern instead of the shared
  `requireAdminSession()`/`requireAdmin()` helper — re-confirmed they're
  still inconsistent (maintainability issue), but since `middleware.ts`
  gates all of them first, this remains non-exploitable as previously
  assessed, not a new finding.
