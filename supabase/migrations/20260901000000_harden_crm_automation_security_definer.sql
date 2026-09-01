-- Restrict CRM automation RPC functions to internal callers only.
--
-- create_crm_task_once and run_due_crm_automations_sql are SECURITY DEFINER
-- functions. Postgres grants EXECUTE to PUBLIC by default, so anon/authenticated
-- could call them directly via POST /rest/v1/rpc/<function> using the public
-- anon key -- bypassing the app entirely and bypassing table-level RLS
-- (SECURITY DEFINER functions run with the function owner's privileges, not
-- the caller's). Confirmed live via the Supabase security advisor
-- (anon_security_definer_function_executable /
-- authenticated_security_definer_function_executable).
--
-- run_due_crm_automations_sql is invoked internally only, via the
-- "latimore-sql-crm-automation-every-5-min" pg_cron job (runs as the job
-- owner, unaffected by this revoke). create_crm_task_once is called by
-- run_due_crm_automations_sql and by service-role backend code, both
-- unaffected -- postgres and service_role retain EXECUTE via their own
-- direct grants, separate from the PUBLIC grant being revoked here.
--
-- Every step below is guarded on the target object existing: these
-- functions/view were created by migrations applied directly to the
-- production project and not fully mirrored as files under
-- supabase/migrations/, so a fresh database built from just this repo's
-- tracked migrations (e.g. the Supabase Preview branch this PR spins up)
-- won't have them yet. Guarding keeps this migration a no-op there instead
-- of failing, while still applying cleanly against production.
DO $$
BEGIN
  IF to_regprocedure('public.create_crm_task_once(text, text, text, text, text, timestamptz, text, jsonb)') IS NOT NULL THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.create_crm_task_once(text, text, text, text, text, timestamptz, text, jsonb) FROM PUBLIC';
    EXECUTE 'ALTER FUNCTION public.create_crm_task_once(text, text, text, text, text, timestamptz, text, jsonb) SET search_path = public, pg_temp';
  END IF;

  IF to_regprocedure('public.run_due_crm_automations_sql()') IS NOT NULL THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.run_due_crm_automations_sql() FROM PUBLIC';
    EXECUTE 'ALTER FUNCTION public.run_due_crm_automations_sql() SET search_path = public, pg_temp';
  END IF;

  -- touch_updated_at: mutable-search_path fix only, no EXECUTE grant to touch.
  IF to_regprocedure('public.touch_updated_at()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.touch_updated_at() SET search_path = public, pg_temp';
  END IF;

  -- funnel_daily_performance was created SECURITY DEFINER, so it queried
  -- "events" with the view owner's privileges rather than the querying
  -- role's. Switch to SECURITY INVOKER (PG15+) so it respects the querying
  -- role's own RLS/grants instead.
  IF to_regclass('public.funnel_daily_performance') IS NOT NULL THEN
    EXECUTE 'ALTER VIEW public.funnel_daily_performance SET (security_invoker = true)';
  END IF;
END $$;
