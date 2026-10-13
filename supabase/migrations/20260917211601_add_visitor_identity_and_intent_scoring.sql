create table if not exists "VisitorIdentity" (
  id text primary key,
  visitor_id text not null unique,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  source text,
  medium text,
  campaign text,
  landing_page text,
  referrer text,
  county text,
  product_interest text,
  lead_session_id text,
  contact_id text,
  created_at timestamptz not null default now()
);

create table if not exists "VisitorIntentEvent" (
  id text primary key,
  visitor_id text not null,
  event_type text not null,
  page_url text,
  score_delta integer not null default 0,
  metadata jsonb default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table if not exists "LeadIntentScore" (
  id text primary key,
  visitor_id text not null unique,
  contact_id text,
  score integer not null default 0,
  intent_level text not null default 'visitor',
  last_scored_at timestamptz not null default now(),
  metadata jsonb default '{}'::jsonb
);

create index if not exists visitor_intent_event_visitor_idx on "VisitorIntentEvent"(visitor_id);
create index if not exists lead_intent_score_score_idx on "LeadIntentScore"(score desc);
