# Security Audit Report — Latimore Hub

**Scope:** Audit of the current codebase against the security-relevant requirements in `SPEC-1-Latimore-Hub-MVP-Implementation` (admin RBAC, canonical lead intake, CRM audit trail, AI publish gating, tracking redirects, OAuth token encryption, secrets handling). No code changes were made; this is a findings report.

**Method:** Static review of route handlers, middleware, service-layer code, and Prisma schema. All findings below were independently verified by reading the cited files (not taken solely on agent summary).

---

## Summary table

| # | Finding | Severity | Location |
|---|---|---|---|
| 1 | No role differentiation — all admins have full access | Medium | No `AdminUser`/`AdminRole` model exists |
| 2 | `crm_tasks` Supabase table bypasses Prisma `Task` model entirely | High | `app/api/tasks/route.ts` |
| 3 | Task mutations (create/update) write zero audit trail | High | `app/api/tasks/route.ts` |
| 4 | AI compliance check result is advisory only — never blocks publish | High | `lib/ai/compliance.ts`, `app/api/cron/content-publishing/route.ts` |
| 5 | `content-publishing` cron publishes anything `status: scheduled`, no `approved` gate | High | `app/api/cron/content-publishing/route.ts:16-18` |
| 6 | Fillout webhook writes a duplicate `form_submit` Event per submission | Medium | `app/api/webhooks/fillout/route.ts:187-227` + `lib/hub/upsert-lead.ts:164` |
| 7 | `TOKEN_ENCRYPTION_KEY` missing → OAuth tokens silently stored in plaintext, no startup check | High | `lib/crypto.ts:41-43` |
| 8 | `/api/lead` and `/api/leads` both live with diverging validation logic | Low | `app/api/lead/route.ts`, `app/api/leads/route.ts` |
| 9 | Bot-classification helper exists but is never called anywhere | Low | `lib/tracking/bot.ts` |
| 10 | No `TrackingLink`/`TrackingClick` models or generic redirect route yet | Low | spec gap, not a live vulnerability |
| 11 | Digital-card tracking endpoint has no auth beyond rate limiting | Low | `app/api/webhooks/card/route.ts` (analytics-only, no PII/financial risk) |

**What's solid (no action needed):** `requireAdminSession()` throws if `DISABLE_ADMIN_AUTH=true` under `NODE_ENV=production`; NextAuth `signIn` callback already rejects non-allowlisted Google accounts; cron-secret comparisons use `crypto.timingSafeEqual`; Fillout/booking webhooks verify HMAC/secret with timing-safe comparison and DB-level idempotency (`ProcessedWebhook`); `upsertLead()` is wrapped in a single `prisma.$transaction`; AES-256-GCM is correctly implemented with a fresh random IV per call; OAuth token read paths consistently call `decryptToken()`; no hardcoded secrets found; `.env*` files are git-ignored and nothing live is tracked; the one active redirect (`/api/redirect/ethos`) targets a hardcoded brand URL, so it isn't open-redirect-able.

---

## Findings in detail

### 1. No role differentiation (Medium)
Every admin check in the codebase (`requireAdminSession()` in `lib/ai/shared.ts`, `requireAdmin()` in `lib/require-admin.ts`, and `middleware.ts`) is binary: an email is on the `ADMIN_EMAILS` allowlist or it isn't. There is no `AdminUser`/`AdminRole` model and no `requireRole()` helper anywhere in the repo. Any admin account can mutate CRM data, approve content, and access AI routes — there's no way to give a junior agent read/task-only access without giving them everything.

### 2 & 3. Task API bypasses Prisma and has no audit trail (High)
`app/api/tasks/route.ts` queries a raw Supabase table directly:
```ts
const supabase = ... // service-role client
.from('crm_tasks').select(...)   // GET
.from('crm_tasks').insert({...}) // POST
.from('crm_tasks').update(...)   // PATCH
```
This runs entirely outside Prisma, even though `prisma/schema.prisma` already defines a `Task` model. Two consequences: (a) the CRM has two parallel, divergent task stores, and (b) none of these mutations call `ingestEvent()` or write a `SystemEvent`, so task creation/completion is untracked — there is no audit trail for "who closed this follow-up task and when."

By contrast, `lib/hub/change-stage.ts` does this correctly (writes `InquiryStageHistory` + fires a `stage_changed` Event) and should be the template for fixing the task route.

### 4 & 5. AI compliance is advisory, content-publishing has no approval gate (High)
`checkCompliance()` runs when content is generated, but the result is only ever stored in `ContentAsset.metadata.compliance` — nothing reads that field to block a status transition. The publishing cron is:
```ts
const dueContent = await prisma.contentAsset.findMany({
  where: { status: 'scheduled', scheduledFor: { lte: now } },
})
```
It checks `status: 'scheduled'`, not `'approved'`. Anything moved to `scheduled` — including content that failed compliance, or content nobody reviewed — publishes automatically at its scheduled time. Separately, `app/api/social/posts/route.ts` lets a caller set `status: 'approved'` directly via `publishNow: true` with no server-side approval check backing that claim. Net effect: the spec's "AI content is draft-only until ADMIN/REVIEWER approves" requirement is not enforced anywhere in code today — it's a manual convention, not a gate.

### 6. Duplicate `form_submit` events on the Fillout path (Medium)
`lib/hub/upsert-lead.ts:164` creates a `form_submit` Event as part of its transaction. `app/api/webhooks/fillout/route.ts:206-227` then calls `ingestEvent({ eventType: 'form_submit', ... })` again after `upsertLead()` returns. Every Fillout submission produces two `form_submit` Event rows, which will double-count form submissions in any analytics rollup keyed on that event type.

### 7. Silent plaintext fallback for OAuth tokens (High)
`lib/crypto.ts` is explicitly documented and coded to do this:
```ts
export function encryptToken(plain: string): string {
  const key = getKey()
  if (!key) return plain   // no warning, no error
  ...
}
```
If `TOKEN_ENCRYPTION_KEY` is ever unset in production — a deploy-config mistake, not a code bug — every newly-stored Google Calendar / Facebook / LinkedIn OAuth token is written to the database in plaintext, with zero log line or thrown error to flag it. The app starts up fine and looks like it's working. This is exactly the kind of failure that goes unnoticed until a database backup leaks. Recommend: fail startup (or at minimum log a loud `console.error` once at boot, and ideally throw in `requireAdminSession`-style production guard) if `NODE_ENV=production` and `TOKEN_ENCRYPTION_KEY` is unset.

### 8. Duplicate lead-intake routes (Low)
`/api/lead` (legacy) and `/api/leads` (canonical) both exist and run separately-maintained Zod schemas — `/api/leads` has a honeypot check the legacy route lacks. This matches the spec's "Should Have" expectation that `/api/lead` becomes a thin wrapper, but right now they're two independent implementations that can drift.

### 9 & 10. Tracking/redirect infrastructure is partially built (Low)
`lib/tracking/bot.ts` defines `classifyClick()` but it's dead code — nothing calls it. There's no `TrackingLink`/`TrackingClick` model or generic `/api/redirect/[id]` route yet; the only live redirect (`/api/redirect/ethos`) is hardcoded to one destination, so it's not exploitable, but it also doesn't give the campaign-tracking auditability the spec wants.

### 11. Digital-card endpoint has no request authentication (Low)
`app/api/webhooks/card/route.ts` (despite the "webhook" naming, this is the public digital-business-card visit/click tracker, not a payment-card endpoint) accepts any POST that matches its Zod schema, protected only by IP rate limiting. Anyone can forge "visit"/"click" analytics events for arbitrary `leadSessionId`s. Low severity because it only pollutes analytics Event rows — no financial or PII exposure — but worth a shared-secret or signed-payload check if card-scan analytics integrity matters.

---

## Recommended priority order
1. Fix the `TOKEN_ENCRYPTION_KEY` silent-plaintext fallback (#7) — cheapest fix, highest blast radius if missed.
2. Add a real approval gate before `content-publishing` cron and the `publishNow` shortcut (#4, #5) — directly blocks the spec's "won't autonomously publish" requirement.
3. Migrate `app/api/tasks/route.ts` off `crm_tasks` onto Prisma `Task`, and add `SystemEvent` writes for task create/update/complete (#2, #3).
4. Remove the duplicate Fillout `form_submit` event (#6) — one-line fix, fixes analytics double-counting immediately.
5. RBAC (`AdminUser`/`AdminRole`) and tracking-link infrastructure (#1, #9, #10) are genuine spec gaps but lower urgency — no active exploit, just missing functionality.
