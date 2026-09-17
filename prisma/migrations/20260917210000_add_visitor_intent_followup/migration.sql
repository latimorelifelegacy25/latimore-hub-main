-- Visitor intent / click follow-up intelligence
-- Idempotent because the production tables were introduced before this migration
-- was checked into source control.

CREATE TABLE IF NOT EXISTS public."VisitorIdentity" (
  id text PRIMARY KEY,
  visitor_id text NOT NULL UNIQUE,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  source text,
  medium text,
  campaign text,
  landing_page text,
  referrer text,
  county text,
  product_interest text,
  lead_session_id text,
  contact_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."VisitorIntentEvent" (
  id text PRIMARY KEY,
  visitor_id text NOT NULL,
  event_type text NOT NULL,
  page_url text,
  score_delta integer NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."LeadIntentScore" (
  id text PRIMARY KEY,
  visitor_id text NOT NULL UNIQUE,
  contact_id text,
  score integer NOT NULL DEFAULT 0,
  intent_level text NOT NULL DEFAULT 'visitor',
  last_scored_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_visitor_intent_event_visitor_created
  ON public."VisitorIntentEvent" (visitor_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS visitor_intent_event_visitor_idx
  ON public."VisitorIntentEvent" (visitor_id);

CREATE INDEX IF NOT EXISTS idx_lead_intent_score_level
  ON public."LeadIntentScore" (intent_level, score DESC);

CREATE INDEX IF NOT EXISTS lead_intent_score_score_idx
  ON public."LeadIntentScore" (score DESC);

ALTER TABLE public."VisitorIdentity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."VisitorIntentEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."LeadIntentScore" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'VisitorIdentity'
      AND policyname = 'server_only_visitor_identity'
  ) THEN
    CREATE POLICY server_only_visitor_identity
      ON public."VisitorIdentity"
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'VisitorIntentEvent'
      AND policyname = 'server_only_visitor_intent_event'
  ) THEN
    CREATE POLICY server_only_visitor_intent_event
      ON public."VisitorIntentEvent"
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'LeadIntentScore'
      AND policyname = 'server_only_lead_intent_score'
  ) THEN
    CREATE POLICY server_only_lead_intent_score
      ON public."LeadIntentScore"
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.recalculate_lead_intent_score(p_visitor_id text)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  total integer;
BEGIN
  SELECT COALESCE(SUM(score_delta), 0)
    INTO total
  FROM public."VisitorIntentEvent"
  WHERE visitor_id = p_visitor_id;

  INSERT INTO public."LeadIntentScore" (
    id,
    visitor_id,
    score,
    intent_level,
    last_scored_at
  )
  VALUES (
    gen_random_uuid()::text,
    p_visitor_id,
    total,
    CASE
      WHEN total >= 80 THEN 'hot'
      WHEN total >= 50 THEN 'qualified'
      WHEN total >= 20 THEN 'engaged'
      ELSE 'new'
    END,
    now()
  )
  ON CONFLICT (visitor_id)
  DO UPDATE SET
    score = EXCLUDED.score,
    intent_level = EXCLUDED.intent_level,
    last_scored_at = now();
END;
$$;
