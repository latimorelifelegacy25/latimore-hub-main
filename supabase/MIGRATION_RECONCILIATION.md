# Supabase migration history reconciliation

Status: draft; fresh Preview replay is still blocked. Do not merge as a verified Preview fix.

## Source and scope

On October 11, 2026, a read-only query of `supabase_migrations.schema_migrations`
in the `Latimore-hub` project (`eoihgvahvfpgbromvzkd`) returned **35**, not 36,
applied entries. All 35 entries are exported under `supabase/migrations/`, using
their actual remote versions and names. SQL comes directly from each entry's
`statements` array, joined with a newline and terminated with a newline.
No historical statements have been rewritten, including data backfills, grants,
cron setup, and inserts into `_prisma_migrations`.

`migration-history-export.json` records each version, name, statement count, and
SHA-256 of the exported SQL. It also records hashes of the five original files,
preserved byte-for-byte under `legacy-migrations/` outside the active replay path.
The 25 Prisma migration files are unchanged.

This export performs no production DDL, data updates, migration repair, history
insertion/deletion, Prisma deployment, or Supabase database push. Publishing or
merging a PR is distinct from verification of a database rebuild.

## Original repository files

| Preserved original | Reconciliation |
| --- | --- |
| `20260526135000_create_leads_table.sql` | Remote version is `20260526135426`; SQL differs only by an initial newline. |
| `20260526135100_create_tracking_events_table.sql` | Remote version is `20260526135429`; SQL differs only by an initial newline. |
| `20260613_latimore_automation_engine.sql` | No exact remote version/name match; remote automation history has multiple versions. Preserve the original separately rather than replay it as a new production change. |
| `20260620000000_harden_leads_numeric_value.sql` | No remote version/name match. Do not assume the recorded history covers its schema and data changes. Preserve it pending a schema comparison. |
| `20260901000000_harden_crm_automation_security_definer.sql` | Remote versions `20260901133820` and `20260901133843` record hardening changes. Preserve the original guards separately; export the actual remote SQL unchanged. |

## Verification performed

- Every active migration version and name matches the read-only export, with no
  duplicate versions or additional active SQL files.
- All 35 SQL files parse with the PostgreSQL parser (`pglast`).
- Every exported file exactly matches the documented serialization of the remote
  statements; all five archived originals match their recorded byte hashes.
- A fresh disposable PostgreSQL 17.5 instance (PGlite) with `anon`,
  `authenticated`, and `service_role` roles replayed the first two migrations.
  The third, `20260528180701_social_analytics_engagement.sql`, failed:
  `type "EventType" does not exist`.

PGlite is an isolated PostgreSQL runtime, not a full Supabase service environment.
The observed missing-type failure is conclusive for the exported history alone;
later Supabase extension, Auth, cron, and schema dependencies remain unverified.

## Remaining work before merge

The remote history is not a complete schema bootstrap. The initial Prisma
migration `20260325034227_init` defines `EventType` and the core application
tables, but has no corresponding Supabase history entry. A second early Prisma
migration, `20260412001548_add_lead_tracking`, also predates the Supabase history.
The live `_prisma_migrations` table contains six completed records while the repo
contains 25 migration directories. Recorded SQL alone cannot establish the
provenance of every live schema object. Simply copying all Prisma files into
the Supabase history could replay changes already represented there.

1. Capture and compare the live schema with an isolated reconstruction, including
   relevant schemas, extensions, functions, triggers, policies, grants, and cron
   jobs. Account for the archived numeric-value migration and other unrecorded
   changes. Use schema-only inspection, not customer-data export.
2. Design and review the missing bootstrap/baseline with one explicit migration
   ownership strategy. If a new baseline requires production history changes,
   disclose that concrete change separately; this PR does not authorize or make
   it. Do not invent historical versions or silently mark migrations reverted.
3. Replay the complete reviewed history in a disposable Supabase environment,
   compare its resulting schema with production, and verify Preview and CI.
4. Confirm automatic production deployment behavior before making the PR ready
   or merging. Until these checks pass, this remains a draft reconciliation,
   not a complete Preview repair.

Reference: https://supabase.com/docs/reference/cli/supabase-migration-fetch
