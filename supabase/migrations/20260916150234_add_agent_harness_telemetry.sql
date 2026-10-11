create table if not exists public.workflow_runs (
  id uuid primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  workflow_name text not null,
  workflow_version text,
  trigger_type text,
  trigger_payload jsonb not null default '{}'::jsonb,
  contact_id uuid,
  agent_id uuid,
  status text not null default 'pending',
  started_at timestamptz,
  completed_at timestamptz,
  duration_ms integer,
  steps jsonb not null default '[]'::jsonb,
  context jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  error text,
  compliance_passed boolean,
  compliance_notes text,
  tokens_used integer not null default 0,
  estimated_cost numeric(12,6) not null default 0
);

create index if not exists idx_workflow_runs_created_at on public.workflow_runs(created_at desc);
create index if not exists idx_workflow_runs_status on public.workflow_runs(status, created_at desc);
create index if not exists idx_workflow_runs_workflow_name on public.workflow_runs(workflow_name, created_at desc);
create index if not exists idx_workflow_runs_contact_id on public.workflow_runs(contact_id, created_at desc);
create index if not exists idx_workflow_runs_completed_at on public.workflow_runs(completed_at desc);
create index if not exists idx_workflow_runs_compliance on public.workflow_runs(compliance_passed) where compliance_passed is not null;

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor_type text not null,
  actor_label text,
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  before_state jsonb,
  after_state jsonb,
  request_id text,
  is_pii_event boolean not null default false,
  retention_days integer not null default 2555
);

create index if not exists idx_audit_log_entity on public.audit_log(entity_type, entity_id, created_at desc);
create index if not exists idx_audit_log_action on public.audit_log(action, created_at desc);
create index if not exists idx_audit_log_workflow_runs on public.audit_log(entity_type, entity_id, created_at desc) where entity_type = 'workflow_run';

alter table public.workflow_runs enable row level security;
alter table public.audit_log enable row level security;

comment on column public.workflow_runs.context is 'PII-sensitive workflow execution context. Server/service-role only; never expose raw context in public analytics.';
comment on table public.audit_log is 'Server-side operational audit trail for Latimore OS workflow execution. No public policies are granted.';
