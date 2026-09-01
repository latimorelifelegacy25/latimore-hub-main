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
REVOKE EXECUTE ON FUNCTION public.create_crm_task_once(text, text, text, text, text, timestamptz, text, jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.run_due_crm_automations_sql() FROM PUBLIC;

-- Pin search_path on SECURITY DEFINER (and other) functions so a caller
-- can't shadow an unqualified identifier by creating a same-named object
-- earlier in their session's search_path.
ALTER FUNCTION public.create_crm_task_once(text, text, text, text, text, timestamptz, text, jsonb) SET search_path = public, pg_temp;
ALTER FUNCTION public.run_due_crm_automations_sql() SET search_path = public, pg_temp;
ALTER FUNCTION public.touch_updated_at() SET search_path = public, pg_temp;

-- funnel_daily_performance was created SECURITY DEFINER, so it queried
-- "events" with the view owner's privileges rather than the querying role's.
-- Switch to SECURITY INVOKER (PG15+) so it respects the querying role's own
-- RLS/grants instead.
ALTER VIEW public.funnel_daily_performance SET (security_invoker = true);
