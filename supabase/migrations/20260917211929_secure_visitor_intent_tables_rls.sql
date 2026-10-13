ALTER TABLE public."VisitorIdentity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."VisitorIntentEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."LeadIntentScore" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "server_only_visitor_identity"
ON public."VisitorIdentity"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "server_only_visitor_intent_event"
ON public."VisitorIntentEvent"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "server_only_lead_intent_score"
ON public."LeadIntentScore"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
