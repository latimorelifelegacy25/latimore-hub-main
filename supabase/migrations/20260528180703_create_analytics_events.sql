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

create index if not exists analytics_events_event_name_idx on public.analytics_events(event_name);
create index if not exists analytics_events_campaign_idx on public.analytics_events(campaign);
create index if not exists analytics_events_created_at_idx on public.analytics_events(created_at desc);

alter table public.analytics_events enable row level security;
