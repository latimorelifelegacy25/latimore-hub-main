-- Harden public.leads for dashboard aggregation without breaking existing lead-intake columns.
-- Converts any existing text value column to numeric and adds dashboard stage/product/market fields.

create extension if not exists pgcrypto;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

alter table public.leads
  add column if not exists name text,
  add column if not exists full_name text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists market text,
  add column if not exists county text,
  add column if not exists product text,
  add column if not exists product_interest text,
  add column if not exists stage text not null default 'New Inquiry';

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'leads' and column_name = 'value'
  ) then
    alter table public.leads alter column value drop default;
    alter table public.leads
      alter column value type numeric(12,2)
      using coalesce(nullif(regexp_replace(value::text, '[^0-9.-]', '', 'g'), '')::numeric, 0.00);
  else
    alter table public.leads add column value numeric(12,2);
  end if;
end $$;

alter table public.leads
  alter column value set default 0.00,
  alter column value set not null;

update public.leads set value = 0.00 where value is null;
update public.leads set name = coalesce(name, full_name) where name is null and full_name is not null;
update public.leads set product = coalesce(product, product_interest) where product is null and product_interest is not null;
update public.leads set market = coalesce(market, county) where market is null and county is not null;

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

create index if not exists leads_value_idx on public.leads (value);
create index if not exists leads_stage_idx on public.leads (stage);
create index if not exists leads_created_at_idx on public.leads (created_at desc);
