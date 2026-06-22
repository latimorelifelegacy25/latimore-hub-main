# Latimore OS Contact Outreach Lifecycle — 2026-06-20

## Change

Adds `latimore-os/agent-harness/src/contact-outreach-lifecycle.ts`.

## Purpose

The module gives Latimore OS a dedicated contact lifecycle entrypoint for CRM-triggered follow-up events:

- `STALE_STAGE`
- `MISSED_BOOKING`
- `SCORE_SPIKE`

## Safety posture

The lifecycle builds a reviewed draft payload with `STAGED_FOR_REVIEW` status. It does not send a message.

## Implementation

The module:

1. Loads the contact through the existing agent-harness Supabase client.
2. Calls the existing `DraftWorker`.
3. Calls the existing `ComplianceReviewer`.
4. Falls back to a conservative check-in message if the review fails.
5. Returns a staged draft payload for a later review/persistence step.

## Why no Prisma migration in this PR

The current schema already has `SystemEvent`, `AiRun`, `ConversationMessage`, `EmailLog`, and related CRM tables. Adding a new `AiOutboundDraft` model should be a separate migration PR after the exact review queue UI/data model is selected.

## Validation needed

Run:

```bash
npm run agent-harness:typecheck
```

Then decide whether the final staging destination should be:

- `system_events`
- `conversation_messages`
- a new `ai_outbound_drafts` table
