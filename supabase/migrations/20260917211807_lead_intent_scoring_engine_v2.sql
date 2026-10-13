CREATE OR REPLACE FUNCTION public.recalculate_lead_intent_score(p_visitor_id text)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  total integer;
BEGIN
  SELECT COALESCE(SUM("score_delta"),0)
  INTO total
  FROM public."VisitorIntentEvent"
  WHERE visitor_id = p_visitor_id;

  INSERT INTO public."LeadIntentScore" (id, visitor_id, score, intent_level, last_scored_at)
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

CREATE INDEX IF NOT EXISTS idx_visitor_intent_event_visitor_created
ON public."VisitorIntentEvent"(visitor_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_lead_intent_score_level
ON public."LeadIntentScore"(intent_level, score DESC);
