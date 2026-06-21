# Latimore OS — Architecture & Technical Specification

**Version:** 1.1.0  
**Date:** June 2026  
**Author:** Jackson M. Latimore Sr., MBA  
**Tagline:** Protecting Today. Securing Tomorrow. #TheBeatGoesOn

---

## Overview

Latimore OS is the full-stack operating system for Latimore Life & Legacy LLC. It is a purpose-built insurance CRM, marketing automation platform, and AI agent harness designed to manage leads, automate follow-up, track production, and orchestrate intelligent workflows — all from a single command center.

`latimore-os/agent-harness/` specifically is a **Supabase-backed DAG workflow engine**: a generic `WorkflowOrchestrator` resolves step dependencies, looks workers up by name in a `workerRegistry`, and runs them with retry/timeout/cost tracking — it is not a hardcoded CRM → Draft → Compliance pipeline. Named `WorkflowDefinition`s (in `workflows/`) wire workers together for specific business processes; new processes are added by writing a new workflow definition, not by hand-rolling a new pipeline.

---

## Stack

| Layer | Technology | Purpose |
|---|---|---|
| Database / Truth | Supabase (Postgres + Auth + Realtime) | CRM data, audit logs, auth |
| Edge / Pipes | Cloudflare Workers + Queues | QR tracking, webhooks, intake, scheduled jobs |
| UI / Command Center | Next.js 14 (App Router) + Tailwind CSS | Admin dashboard, public site, PAHS funnel |
| AI / Brain | LLM Agent Harness (TypeScript) | Orchestrated AI workflows behind feature flags |
| Email / SMS | Resend (email) + Twilio (SMS) | Automated follow-up sequences |
| Analytics | GA4 + Vercel Analytics | Traffic, conversion, attribution |

---

## Repository Structure

```
latimore-os/
├── supabase/
│   ├── migrations/          # SQL schema migrations
│   ├── seed/                # Seed data for development
│   └── config.toml          # Supabase local config
│
├── cloudflare-worker/
│   ├── src/
│   │   ├── index.ts         # Worker entry point + router
│   │   ├── handlers/        # Route handlers
│   │   ├── queues/          # Queue consumers
│   │   └── lib/             # Shared utilities
│   ├── wrangler.toml        # Cloudflare config
│   └── package.json
│
├── agent-harness/
│   ├── src/
│   │   ├── orchestrator.ts            # WorkflowOrchestrator — DAG executor, retries, timeouts, cost tracking
│   │   ├── types.ts                   # WorkflowDefinition / StepDefinition / BaseWorker / WorkerEnv
│   │   ├── contact-outreach-lifecycle.ts
│   │   ├── lib/
│   │   │   ├── supabase.ts            # createDBClient(env) — this package's own Supabase REST client
│   │   │   ├── llm.ts                 # callOpenAI / estimateCost (Gemini-routed)
│   │   │   └── compliance-rules.ts    # re-exports canonical PA DOI patterns from the main app's lib/ai/compliance.ts
│   │   ├── workers/
│   │   │   ├── registry.ts            # workerRegistry — name → BaseWorker instance lookup
│   │   │   ├── research-worker.ts
│   │   │   ├── draft-worker.ts        # LLM-drafted emails/SMS/social posts
│   │   │   ├── compliance-reviewer.ts # pattern check (shared rules) + conditional AI review
│   │   │   ├── send-worker.ts         # Resend/Twilio send; holds for manual review if compliance failed
│   │   │   ├── crm-worker.ts          # contact/task/pipeline updates
│   │   │   └── analytics-worker.ts
│   │   └── workflows/
│   │       ├── lead-follow-up.ts
│   │       ├── no-show-recovery.ts
│   │       ├── gbp-post-draft.ts
│   │       └── weekly-kpi-report.ts
│   └── package.json                   # independent npm package — own deps, own tsconfig, no shared node_modules with the root app
│
└── docs/
    ├── ARCHITECTURE.md      # This file
    ├── DATABASE.md          # Schema documentation
    ├── API.md               # API endpoint reference
    └── WORKFLOWS.md         # Agent workflow reference
```

The Next.js admin/public app (CRM, analytics, content tools) is the **repository root**, not nested under `latimore-os/` — it's a separate Prisma + Supabase-pooled-connection app from the one `agent-harness/` talks to via `createDBClient`. Treat `latimore-os/` and the root app as two systems that happen to live in the same git repo, not one shared codebase.

---

## Data Flow

```
User Action (QR scan / form submit / booking)
        ↓
Cloudflare Worker (stateless intake)
        ↓
Supabase (write lead/event to DB)
        ↓
Supabase Realtime / Webhook trigger
        ↓
Agent Harness (workflow triggered)
        ↓
WorkflowOrchestrator.run() — resolves step dependencies into parallel groups
        ↓
workerRegistry workers execute in dependency order (e.g. Research → Draft → ComplianceReviewer → SendWorker → CRMWorker)
        ↓
Output (email/SMS sent, CRM updated, admin notified)
```

Per-step `ComplianceReviewer` results are passed forward to `SendWorker` via each
workflow's `input_map` (`compliance: 'compliance'`); `SendWorker` refuses to
send and creates a manual-review task instead if `compliance.passed === false`.
This is a deliberate hardening fix — the orchestrator's own `compliance_required`
gate only runs *after* all steps (including sends) have executed, so it is an
audit/abort mechanism for the run as a whole, not a pre-send approval gate on
its own.

---

## Hardening Status (as of v1.1.0)

- **Compliance ruleset, single-sourced.** `agent-harness/src/workers/compliance-reviewer.ts`
  previously kept its own copy of the PA DOI regex rules, which had already drifted
  from the main app's `lib/ai/compliance.ts` (notably a much broader, false-positive-prone
  `FEAR_BASED_MARKETING` pattern). It now imports the canonical patterns via
  `agent-harness/src/lib/compliance-rules.ts`, a relative-import seam across the
  repo boundary. `npm run agent-harness:typecheck` is wired into `npm run validate`
  so a broken import fails the deploy gate instead of failing silently at runtime.
- **Send approval gate.** `SendWorker` now requires the upstream `ComplianceReviewer`
  result before sending email/SMS; on failure it holds and files a `compliance_review`
  task rather than sending. Wired into `lead-follow-up` and `no-show-recovery`.
- **Not yet done:** worker registry/workflow schema validation, per-run audit log
  surfaced to an admin UI, cost tracking surfaced anywhere outside `WorkflowRun.estimated_cost`,
  and a deployment checklist. `gbp-post-draft` and `weekly-kpi-report` have not been
  reviewed for the same class of gaps.

---

## Security Model

- All Supabase access uses Row Level Security (RLS)
- Cloudflare Worker uses signed secrets (never exposed to client)
- Agent Harness runs server-side only, behind feature flags
- PII is never logged in plain text — all audit logs use masked fields
- HIPAA-aware: health data fields are encrypted at rest

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Cloudflare
CF_ACCOUNT_ID=
CF_API_TOKEN=

# AI
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Communications
RESEND_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Analytics
NEXT_PUBLIC_GA4_ID=G-S0Q3E4DEBJ
NEXT_PUBLIC_GA4_CARD_ID=G-91DT7W1KRP

# Feature Flags
AGENT_HARNESS_ENABLED=false
AGENT_HARNESS_WORKFLOWS=lead-follow-up,weekly-kpi-report
```