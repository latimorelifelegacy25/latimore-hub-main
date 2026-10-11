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

INSERT INTO public._prisma_migrations (id,checksum,migration_name,started_at,finished_at,applied_steps_count) VALUES (gen_random_uuid()::text,'03b916920f1779e163bc6536c361cebe724ba623b4945fb3a223663a9f0564e1','20261005120000_add_form_start_event',now(),now(),1);
