create extension if not exists pgcrypto;

alter table public.leads
  add column if not exists state text,
  add column if not exists journey text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'leads_journey_check'
      and conrelid = 'public.leads'::regclass
  ) then
    alter table public.leads
      add constraint leads_journey_check
      check (journey is null or journey in ('client', 'business_partner', 'both'));
  end if;
end $$;

create table if not exists public.intake_profiles (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  marital_status text,
  spouse_name text,
  age_range text,
  smoker boolean,
  has_children boolean,
  children_ages text,
  occupation text,
  family_notes text,
  recreation_notes text,
  motivation_notes text,
  created_at timestamptz default now()
);

create table if not exists public.financial_intake (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  monthly_income numeric(12,2),
  monthly_expenses numeric(12,2),
  emergency_fund numeric(12,2),
  market_assets numeric(12,2),
  has_employer_retirement boolean,
  retirement_plan_types text[],
  retirement_balance numeric(12,2),
  retirement_contribution numeric(12,2),
  contribution_frequency text check (contribution_frequency is null or contribution_frequency in ('per_check', 'monthly', 'annual')),
  has_company_match boolean,
  company_match_details text,
  has_outside_retirement boolean,
  has_life_insurance boolean,
  life_insurance_source text check (life_insurance_source is null or life_insurance_source in ('work', 'outside_work', 'both', 'none')),
  coverage_amount numeric(12,2),
  premium_amount numeric(12,2),
  premium_frequency text check (premium_frequency is null or premium_frequency in ('monthly', 'annual')),
  policy_type text check (policy_type is null or policy_type in ('term', 'permanent', 'unknown')),
  has_living_benefits boolean,
  has_ltc boolean,
  tax_status text check (tax_status is null or tax_status in ('refund', 'owe', 'break_even', 'unknown')),
  tax_amount numeric(12,2),
  min_monthly_savings numeric(12,2),
  max_monthly_savings numeric(12,2),
  has_children boolean,
  children_ages text,
  saving_for_children boolean,
  additional_income_interest boolean,
  created_at timestamptz default now()
);

create table if not exists public.client_priorities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  priority text not null check (
    priority in (
      'tax_advantage',
      'asset_protection',
      'college_funding',
      'debt_management',
      'infinite_banking',
      'life_insurance',
      'estate_planning',
      'indexed_growth',
      'mortgage_protection',
      'business_owner_strategies'
    )
  ),
  importance_rank int,
  why_important text
);

create table if not exists public.dime_calculations (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  debt numeric(12,2) default 0,
  annual_income numeric(12,2) default 0,
  income_multiplier int default 10,
  mortgage_balance numeric(12,2) default 0,
  education_goal numeric(12,2) default 0,
  current_coverage numeric(12,2) default 0,
  calculated_need numeric(12,2) generated always as
    (debt + (annual_income * income_multiplier) + mortgage_balance + education_goal) stored,
  coverage_gap numeric(12,2) generated always as
    (greatest((debt + (annual_income * income_multiplier) + mortgage_balance + education_goal) - current_coverage, 0)) stored,
  created_at timestamptz default now()
);

create table if not exists public.intake_scores (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  client_score int not null,
  advisor_score int not null,
  urgency text not null check (urgency in ('low', 'medium', 'high')),
  recommended_tracks text[],
  summary text,
  created_at timestamptz default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  channel text not null check (channel in ('email', 'google_chat')),
  status text not null check (status in ('pending', 'sent', 'failed')),
  payload jsonb,
  error_message text,
  created_at timestamptz default now()
);

create table if not exists public.booking_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  booking_url text not null,
  clicked_at timestamptz,
  booking_confirmed_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists intake_profiles_lead_id_idx on public.intake_profiles (lead_id);
create index if not exists financial_intake_lead_id_idx on public.financial_intake (lead_id);
create index if not exists client_priorities_lead_id_idx on public.client_priorities (lead_id);
create index if not exists dime_calculations_lead_id_idx on public.dime_calculations (lead_id);
create index if not exists intake_scores_lead_id_idx on public.intake_scores (lead_id);
create index if not exists notifications_lead_id_idx on public.notifications (lead_id);
create index if not exists booking_events_lead_id_idx on public.booking_events (lead_id);
