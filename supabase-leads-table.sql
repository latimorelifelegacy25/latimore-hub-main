-- Latimore Hub OS aggregation-ready leads table.
-- Keeps legacy intake fields while adding numeric `value` for native PostgreSQL SUM/AVG operations.

create extension if not exists pgcrypto;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text,
  full_name text,
  phone text,
  email text,
  market text,
  county text,
  product text,
  product_interest text,
  lead_source text default 'Website',
  page_source text,
  promo_code text,
  status text not null default 'active',
  value numeric(12, 2) not null default 0.00,
  stage text not null default 'New Inquiry',
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_stage_idx on public.leads (stage);
create index if not exists leads_value_idx on public.leads (value);
create index if not exists leads_lead_source_idx on public.leads (lead_source);

alter table public.leads enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='leads' and policyname='authenticated users can read leads') then
    create policy "authenticated users can read leads" on public.leads for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='leads' and policyname='authenticated users can insert leads') then
    create policy "authenticated users can insert leads" on public.leads for insert to authenticated with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='leads' and policyname='authenticated users can update leads') then
    create policy "authenticated users can update leads" on public.leads for update to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='leads' and policyname='authenticated users can delete leads') then
    create policy "authenticated users can delete leads" on public.leads for delete to authenticated using (true);
  end if;
end $$;
