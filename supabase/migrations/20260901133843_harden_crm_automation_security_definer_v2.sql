-- Follow-up: the prior REVOKE targeted anon/authenticated directly, but
-- these functions' EXECUTE privilege was granted to PUBLIC (the implicit
-- pseudo-role), which every role -- including anon and authenticated --
-- inherits from regardless of a per-role REVOKE. Revoke from PUBLIC
-- instead; postgres and service_role keep access via their own direct
-- grants, confirmed still present in information_schema.routine_privileges.
REVOKE EXECUTE ON FUNCTION public.create_crm_task_once(text, text, text, text, text, timestamptz, text, jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.run_due_crm_automations_sql() FROM PUBLIC;
