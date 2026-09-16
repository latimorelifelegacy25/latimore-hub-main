# Latimore OS Canonical Data-Core Cutover — 2026-09-16

## Decision

The Prisma-managed `Contact`, `Inquiry`, `Appointment`, `Task`, `SystemEvent`, `ContentAsset`, and `WeeklyReport` models are the canonical operating data core for Latimore OS.

New agent-harness, edge-intake, booking, reporting, and virtual-intake writes must use that canonical model. Legacy lowercase CRM tables remain only for historical compatibility until their retained records are migrated or archived; they are not the write target for the consolidated operating layer.

## Cutover included in this branch

- Agent harness database adapter now maps CRM operations to canonical Prisma tables.
- Research, CRM, and analytics workers read/write the canonical data core.
- Cloudflare lead intake and Fillout submissions create canonical `Contact` + `Inquiry` records.
- Booking webhooks write canonical `Appointment` records and update canonical pipeline state.
- Lead-queue follow-up tasks write canonical `Task` records.
- Daily, weekly, and monthly reporting reads canonical CRM activity rather than legacy CRM tables/RPC views.
- Virtual interactive intake creates canonical `Contact` + `Inquiry` records; specialized intake extension tables use the canonical Inquiry UUID as their `lead_id` anchor.
- Historical virtual-intake results retain a read-only fallback for previously created legacy lead IDs.
- Workflow execution telemetry persists in `workflow_runs` and `audit_log`.
- CI now typechecks the app, agent harness, and Cloudflare worker.

## Explicit data limits

The canonical Prisma CRM does not currently contain a policy/premium/commission production ledger or a canonical individual-agent production model. Weekly/monthly workflow reports therefore omit those figures rather than deriving or fabricating them from legacy tables.

## Migration posture

This cutover stops new duplicate CRM writes. It does **not** delete historical lowercase tables or their records. Historical migration/archival should be handled as a separate verified data-migration operation after record reconciliation and backup.
