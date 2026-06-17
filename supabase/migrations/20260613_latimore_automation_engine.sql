-- Latimore OS Automation Engine
-- Purpose: scheduled CRM task generation, automation audit logs, and cron endpoint invocation.

create extension if not exists pg_cron;
create extension if not exists pg_net;

alter table if exists public.leads
  add column if not exists last_contacted_at timestamptz,
  add column if not exists next_follow_up_at timestamptz,
  add column if not exists booked_at timestamptz,
  add column if not exists last_automation_at timestamptz,
  add column if not exists score_tier text,
  add column if not exists lead_source text;

create table if not exists public.crm_tasks (
  id uuid primary key default gen_random_uuid(),
  lead_id text,
  title text not null,
  description text,
  task_type text not null default 'follow_up',
  priority text not null default 'normal',
  status text not null default 'open',
  due_at timestamptz not null default now(),
  assigned_to text default 'Jackson Latimore',
  automation_key text,
  payload jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_tasks_lead_id_idx on public.crm_tasks (lead_id);
create index if not exists crm_tasks_status_due_at_idx on public.crm_tasks (status, due_at);
create index if not exists crm_tasks_priority_idx on public.crm_tasks (priority);
create unique index if not exists crm_tasks_once_idx
  on public.crm_tasks (lead_id, automation_key)
  where automation_key is not null;

create table if not exists public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  run_key text not null,
  source text not null default 'cron',
  status text not null default 'started',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  result jsonb not null default '{}'::jsonb,
  error text
);

create index if not exists automation_runs_started_at_idx on public.automation_runs (started_at desc);
create index if not exists automation_runs_run_key_idx on public.automation_runs (run_key);

create table if not exists public.automation_jobs (
  id uuid primary key default gen_random_uuid(),
  job_key text not null unique,
  job_type text not null,
  status text not null default 'pending',
  payload jsonb not null default '{}'::jsonb,
  scheduled_for timestamptz not null default now(),
  attempts integer not null default 0,
  last_error text,
  locked_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists automation_jobs_status_scheduled_idx
  on public.automation_jobs (status, scheduled_for);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_crm_tasks_touch_updated_at on public.crm_tasks;
create trigger trg_crm_tasks_touch_updated_at
before update on public.crm_tasks
for each row execute function public.touch_updated_at();

create or replace function public.create_crm_task_once(
  p_lead_id text,
  p_title text,
  p_description text,
  p_task_type text,
  p_priority text,
  p_due_at timestamptz,
  p_automation_key text,
  p_payload jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_id uuid;
begin
  insert into public.crm_tasks (
    lead_id, title, description, task_type, priority, due_at, automation_key, payload
  )
  values (
    p_lead_id, p_title, p_description, p_task_type, p_priority, p_due_at, p_automation_key, coalesce(p_payload, '{}'::jsonb)
  )
  on conflict (lead_id, automation_key) where automation_key is not null
  do update set
    updated_at = now()
  returning id into v_id;

  return v_id;
end;
$$;

-- After deployment, schedule this from the Supabase SQL editor.
-- Replace YOUR_SITE_URL and YOUR_CRON_SECRET first.
--
-- select cron.schedule(
--   'latimore-run-due-automations-every-5-min',
--   '*/5 * * * *',
--   $$
--   select net.http_post(
--     url := 'https://YOUR_SITE_URL/api/cron/run-due-automations',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'x-cron-secret', 'YOUR_CRON_SECRET'
--     ),
--     body := jsonb_build_object(
--       'source', 'supabase_cron',
--       'job', 'run_due_automations'
--     )
--   );
--   $$
-- );
