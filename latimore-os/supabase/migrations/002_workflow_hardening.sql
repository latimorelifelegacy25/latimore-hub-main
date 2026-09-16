-- Latimore OS workflow hardening
-- Safe to run after 001_initial_schema.sql.

ALTER TABLE IF EXISTS workflow_runs
  ADD COLUMN IF NOT EXISTS context JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_workflow_runs_completed_at
  ON workflow_runs(completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_workflow_runs_compliance
  ON workflow_runs(compliance_passed)
  WHERE compliance_passed IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_log_workflow_runs
  ON audit_log(entity_type, entity_id, created_at DESC)
  WHERE entity_type = 'workflow_run';

COMMENT ON COLUMN workflow_runs.context IS
  'PII-sensitive workflow execution context. Service-role only; never expose raw context in public analytics.';
