# Latimore OS Automation Engine Deploy Guide

This repo now includes the Supabase Cron automation path for CRM follow-up tasks.

## Added files

```txt
app/api/cron/run-due-automations/route.ts
lib/automation/actions.ts
lib/automation/crm.ts
lib/automation/types.ts
supabase/migrations/20260613_latimore_automation_engine.sql
```

## Required environment variables

Add these in Vercel:

```txt
NEXT_PUBLIC_SUPABASE_URL=https://eoihgvahvfpgbromvzkd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CRON_SECRET=long-random-secret
```

The runner also accepts `SUPABASE_URL` as a fallback if `NEXT_PUBLIC_SUPABASE_URL` is not present.

## Deploy sequence

1. Pull latest `main`.
2. Confirm Vercel has the required environment variables.
3. Deploy the app.
4. Run the SQL migration in Supabase.
5. Test the cron route.
6. Schedule the Supabase cron job.

## Test route

```bash
curl -X GET "https://www.latimorelifelegacy.com/api/cron/run-due-automations" \
  -H "x-cron-secret: YOUR_CRON_SECRET"
```

```bash
curl -X POST "https://www.latimorelifelegacy.com/api/cron/run-due-automations" \
  -H "x-cron-secret: YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"source":"manual_test"}'
```

## Schedule in Supabase

After replacing the site URL and secret, run:

```sql
select cron.schedule(
  'latimore-run-due-automations-every-5-min',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://www.latimorelifelegacy.com/api/cron/run-due-automations',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', 'YOUR_CRON_SECRET'
    ),
    body := jsonb_build_object(
      'source', 'supabase_cron',
      'job', 'run_due_automations'
    )
  );
  $$
);
```

## Verify runs

```sql
select * from cron.job order by jobid desc;
select * from cron.job_run_details order by start_time desc limit 25;
select * from public.automation_runs order by started_at desc limit 25;
select * from public.crm_tasks order by created_at desc limit 25;
```

## Current automations

The first production automation set creates CRM tasks for:

- New leads within 24 hours
- No-response leads between 3 and 7 days old
- Booked consultations within 48 hours
- Dormant leads around 30, 60, and 90 days

## Operational note

This is the core scheduler path. QStash can be added later for delayed third-party retries after the base cron path is confirmed live.
