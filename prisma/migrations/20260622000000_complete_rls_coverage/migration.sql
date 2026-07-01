-- Complete RLS coverage for tables introduced after the initial RLS migration.
-- Public Supabase anon/authenticated access remains default-deny; server-side
-- Prisma/service-role paths continue to use privileged credentials.
ALTER TABLE IF EXISTS "AdminUser" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "AgentWorkflowStep" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "LegacyCheckupAssessment" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "AdminUser" FROM anon, authenticated;
REVOKE ALL ON TABLE "AgentWorkflowStep" FROM anon, authenticated;
REVOKE ALL ON TABLE "LegacyCheckupAssessment" FROM anon, authenticated;
