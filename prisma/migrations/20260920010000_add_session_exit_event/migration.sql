-- Record a visitor leaving the public site so identified, engaged visitors can
-- receive a deduplicated CRM follow-up task. PostgreSQL enum changes are
-- intentionally idempotent for safe production deployment.
DO $$
BEGIN
  ALTER TYPE public."EventType" ADD VALUE 'session_exit';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;
