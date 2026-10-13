create extension if not exists pgcrypto;

drop table if exists public.leads cascade;

create table if not exists public.funnels (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  hubspot_contact_id text,
  mailchimp_subscriber_hash text,
  first_name text not null,
  last_name text,
  email text not null,
  phone text,
  zip_code text,
  preferred_contact_method text check (preferred_contact_method in ('email','phone','text','any')),
  selected_funnel_slug text references public.funnels(slug),
  lead_score integer not null default 0,
  lead_status text not null default 'new'
    check (lead_status in ('new','nurturing','booked','consulted','disqualified','archived')),
  source_url text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  user_agent text,
  ip_hash text,
  legacy_source text,
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(email, selected_funnel_slug)
);

create unique index if not exists leads_legacy_idx
  on public.leads(legacy_source, legacy_id)
  where legacy_source is not null;

create table if not exists public.lead_consents (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  consent_type text not null check (consent_type in ('contact','email_marketing','sms','privacy_policy')),
  consent_text text not null,
  consented boolean not null,
  consented_at timestamptz not null default now(),
  source_url text not null
);

create table if not exists public.quiz_responses (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  session_id text not null,
  recommended_funnel_slug text references public.funnels(slug),
  answers jsonb not null,
  score_breakdown jsonb not null,
  completed_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  session_id text,
  event_name text not null,
  funnel_slug text,
  page_url text,
  metadata jsonb default '{}'::jsonb,
  legacy_source text,
  legacy_id text,
  created_at timestamptz not null default now()
);

create unique index if not exists events_legacy_idx
  on public.events(legacy_source, legacy_id)
  where legacy_source is not null;

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  calendly_event_uri text unique not null,
  calendly_invitee_uri text,
  event_type_name text,
  scheduled_start_time timestamptz,
  scheduled_end_time timestamptz,
  invitee_email text,
  invitee_name text,
  status text not null default 'scheduled'
    check (status in ('scheduled','canceled','rescheduled','completed')),
  raw_payload jsonb not null,
  legacy_source text,
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists bookings_legacy_idx
  on public.bookings(legacy_source, legacy_id)
  where legacy_source is not null;

create index if not exists idx_leads_email on public.leads(email);
create index if not exists idx_leads_funnel_status on public.leads(selected_funnel_slug, lead_status);
create index if not exists idx_events_name_created_at on public.events(event_name, created_at);
create index if not exists idx_events_funnel_created_at on public.events(funnel_slug, created_at);
create index if not exists idx_bookings_start_time on public.bookings(scheduled_start_time);

create or replace view public.funnel_daily_performance as
select
  date_trunc('day', created_at) as day,
  funnel_slug,
  count(*) filter (where event_name = 'funnel_view') as funnel_views,
  count(*) filter (where event_name = 'quiz_complete') as quiz_completions,
  count(*) filter (where event_name = 'lead_submit') as leads,
  count(*) filter (where event_name = 'calendly_booked') as booked_consultations
from public.events
group by 1, 2;

alter table public.leads enable row level security;
alter table public.lead_consents enable row level security;
alter table public.quiz_responses enable row level security;
alter table public.events enable row level security;
alter table public.bookings enable row level security;
alter table public.funnels enable row level security;

insert into public.funnels (slug, name) values
  ('life-insurance-basics', 'Life Insurance Basics'),
  ('mortgage-protection', 'Mortgage Protection'),
  ('living-benefits', 'Living Benefits'),
  ('retirement-annuities', 'Retirement / Annuities'),
  ('401k-rollover', '401(k) Rollover'),
  ('college-funding', 'College Funding'),
  ('business-key-person', 'Business / Key Person')
on conflict (slug) do nothing;
