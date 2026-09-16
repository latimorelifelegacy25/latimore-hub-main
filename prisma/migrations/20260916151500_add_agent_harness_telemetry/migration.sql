-- Latimore OS workflow execution telemetry for the canonical Latimore-hub database.
-- These tables extend the existing Prisma-managed CRM; they do not create a second CRM/contact schema.

CREATE TABLE IF NOT EXISTS public.workflow_runs (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  workflow_name TEXT NOT NULL,
  workflow_version TEXT,
  trigger_type TEXT,
  trigger_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  contact_id UUID,
  agent_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  output JSONB NOT NULL DEFAULT '{}'::jsonb,
  error TEXT,
  compliance_passed BOOLEAN,
  compliance_notes TEXT,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  estimated_cost NUMERIC(12,6) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_workflow_runs_created_at
  ON public.workflow_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_status
  ON public.workflow_runs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_workflow_name
  ON public.workflow_runs(workflow_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_contact_id
  ON public.workflow_runs(contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_completed_at
  ON public.workflow_runs(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_compliance
  ON public.workflow_runs(compliance_passed)
  WHERE compliance_passed IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor_type TEXT NOT NULL,
  actor_label TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  before_state JSONB,
  after_state JSONB,
  request_id TEXT,
  is_pii_event BOOLEAN NOT NULL DEFAULT FALSE,
  retention_days INTEGER NOT NULL DEFAULT 2555
);

CREATE INDEX IF NOT EXISTS idx_audit_log_entity
  ON public.audit_log(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action
  ON public.audit_log(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_workflow_runs
  ON public.audit_log(entity_type, entity_id, created_at DESC)
  WHERE entity_type = 'workflow_run';

ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

COMMENT ON COLUMN public.workflow_runs.context IS
  'PII-sensitive workflow execution context. Server/service-role only; never expose raw context in public analytics.';
COMMENT ON TABLE public.audit_log IS
  'Server-side operational audit trail for Latimore OS workflow execution. No public policies are granted.';
