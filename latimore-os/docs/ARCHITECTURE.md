# Latimore OS — Architecture & Technical Specification

**Version:** 1.0.0  
**Date:** June 2026  
**Author:** Jackson M. Latimore Sr., MBA  
**Tagline:** Protecting Today. Securing Tomorrow. #TheBeatGoesOn

---

## Overview

Latimore OS is the full-stack operating system for Latimore Life & Legacy LLC. It is a purpose-built insurance CRM, marketing automation platform, and AI agent harness designed to manage leads, automate follow-up, track production, and orchestrate intelligent workflows — all from a single command center.

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
├── nextjs/
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   │   ├── (public)/    # Public site
│   │   │   ├── admin/       # Command center
│   │   │   └── api/         # API routes
│   │   ├── components/      # Shared UI components
│   │   └── lib/             # Supabase client, utils
│   ├── next.config.ts
│   └── package.json
│
├── agent-harness/
│   ├── src/
│   │   ├── orchestrator.ts  # Workflow orchestrator
│   │   ├── planner.ts       # Step planner
│   │   ├── workers/         # Specialized AI workers
│   │   ├── workflows/       # Named workflow definitions
│   │   ├── skills/          # Tool/skill registry
│   │   └── types.ts         # Shared types
│   └── package.json
│
└── docs/
    ├── ARCHITECTURE.md      # This file
    ├── DATABASE.md          # Schema documentation
    ├── API.md               # API endpoint reference
    └── WORKFLOWS.md         # Agent workflow reference
```

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
Planner → Workers (parallel execution)
        ↓
Reviewer (compliance check)
        ↓
Output (email/SMS sent, CRM updated, admin notified)
```

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