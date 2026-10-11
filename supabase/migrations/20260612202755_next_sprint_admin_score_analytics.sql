alter table public.leads add column if not exists score_tier text not null default 'cold';
create index if not exists leads_score_tier_idx on public.leads (score_tier);

create table if not exists public.app_admins (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);
alter table public.app_admins enable row level security;
drop policy if exists service_role_all on public.app_admins;
create policy service_role_all on public.app_admins for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');
insert into public.app_admins (email, role)
values ('applications@latimorelifelegacy.com', 'admin')
on conflict (email) do update set role = excluded.role;

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  source text,
  medium text,
  campaign text,
  page_path text,
  lead_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.analytics_events enable row level security;
drop policy if exists service_role_all on public.analytics_events;
create policy service_role_all on public.analytics_events for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');
create index if not exists analytics_events_event_name_idx on public.analytics_events (event_name);
create index if not exists analytics_events_campaign_idx on public.analytics_events (campaign);
create index if not exists analytics_events_created_at_idx on public.analytics_events (created_at);
