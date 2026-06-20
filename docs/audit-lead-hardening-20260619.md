# Lead Hardening Audit — 2026-06-19

## Scope

Reviewed the latest lead ingestion hardening changes against `SPEC-HARDENING.md`, with emphasis on:

- Phone uniqueness and deduplication behavior
- Atomicity of `upsertLead()`
- Optional notification/calendar failure handling
- Centralized lead validation response behavior
- PAHS and Fillout webhook response contracts

## Findings and Remediation

### 1. `upsertLead()` still had a non-atomic read-then-create window

**Finding:** The previous implementation replaced `findFirst()` with `findUnique()`, but still performed contact discovery, contact creation, inquiry creation, task creation, event ingest, score updates, and audit events as separate operations.

**Remediation:** Lead persistence is now performed inside a single Prisma transaction. The contact is selected by unique email/phone, updated or created, and all downstream lead artifacts are written in the same transaction. A `P2002` retry path re-runs the transaction once to handle concurrent submissions that race on the unique email or phone keys.

### 2. Conflicting email/phone matches could overwrite another contact's unique key

**Finding:** If an email matched one contact and a normalized phone matched another contact, the prior update path could attempt to write a unique phone/email onto the chosen contact and fail.

**Remediation:** The transaction now detects conflicting unique-key ownership and skips updating a unique field that belongs to another contact. The audit event records whether a conflicting email or phone was skipped.

### 3. Google Chat was still hard-required by the helper

**Finding:** `sendGoogleChatMessage()` used `requiredEnv('GOOGLE_CHAT_WEBHOOK_URL')`, which contradicted the spec rule that optional integrations should disable gracefully when env vars are missing.

**Remediation:** Missing `GOOGLE_CHAT_WEBHOOK_URL` now skips the notification without throwing, with a development-only warning.

### 4. PAHS dedupe reporting was hardcoded

**Finding:** `/api/pahs-lead` returned `deduped: false` even when `upsertLead()` deduped the submission.

**Remediation:** The route now returns the actual `deduped` value from `upsertLead()`.

### 5. Lead validation failures could be reported as webhook 500s

**Finding:** Some `LeadSchema.parse()` failures occurred inside broad `catch` blocks and could be reported as server errors.

**Remediation:** PAHS now uses `safeParse()` and returns `422` for validation failures. The Fillout legacy webhook returns `422` for `ZodError` instead of masking validation issues as a server failure.

## Verification

- `npm run check`
- `npm run lint`
