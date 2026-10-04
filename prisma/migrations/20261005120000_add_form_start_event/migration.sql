-- Record the first interaction with a form so form abandonment (start without
-- submit) can be measured. PostgreSQL enum changes are intentionally
-- idempotent for safe production deployment.
DO $$
BEGIN
  ALTER TYPE public."EventType" ADD VALUE 'form_start';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;
