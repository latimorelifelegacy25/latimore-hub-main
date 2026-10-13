DO $$
BEGIN
  ALTER TYPE public."EventType" ADD VALUE 'session_exit';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;
