CREATE OR REPLACE FUNCTION public.recalculate_lead_intent_score(p_visitor_id text)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  total integer;
BEGIN
  SELECT LEAST(100, COALESCE(SUM(score_delta), 0))::integer
    INTO total
  FROM public."VisitorIntentEvent"
  WHERE visitor_id = p_visitor_id
    AND occurred_at >= now() - interval '30 days'
    AND COALESCE(page_url, '') NOT LIKE '/admin%'
    AND COALESCE(page_url, '') NOT LIKE '/analytics%';

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
