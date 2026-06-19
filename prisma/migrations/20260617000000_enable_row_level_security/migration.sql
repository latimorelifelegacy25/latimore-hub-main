-- Enable Row Level Security on every application table.
--
-- This app never queries Postgres as the Supabase `anon` or `authenticated`
-- role — Prisma connects via DATABASE_URL/DIRECT_URL with a role that has
-- BYPASSRLS, and the few raw supabase-js calls in the codebase
-- (lib/automation/crm.ts, lib/virtual-intake.ts, app/api/pahs-lead, etc.)
-- all use SUPABASE_SERVICE_ROLE_KEY, which also bypasses RLS. So turning
-- RLS on here has no effect on any existing app behavior.
--
-- What it does fix: Supabase auto-exposes every table over a public
-- PostgREST REST/GraphQL API. NEXT_PUBLIC_SUPABASE_ANON_KEY is a required
-- production env var (see lib/env.ts) and is, by Supabase's own design, not
-- a secret — RLS is the only thing that decides what the anon key can read
-- or write. With RLS off, anyone holding that key could call
-- `<project>.supabase.co/rest/v1/<Table>` directly and read or write every
-- row, completely bypassing Next.js middleware, NextAuth, and Prisma.
-- Enabling RLS with no policies makes every table default-deny for the
-- anon/authenticated roles while leaving the app's own data path untouched.
ALTER TABLE "LeadSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Contact" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Inquiry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Appointment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SystemEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ConversationThread" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ConversationMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AiRun" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Note" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InquiryStageHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EmailLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ContentAsset" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MarketingContent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CalendarConnection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CalendarEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SocialConnection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SocialAccount" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SocialPost" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SocialMetric" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SocialComment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AIAnalysis" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Insight" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AutomationRule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WeeklyReport" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UploadedWorkDocument" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SocialTemplate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SocialTemplateUsage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AnalyticsDailyMetric" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AnalyticsBreakdownDaily" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AnalyticsFunnelDaily" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AnalyticsJobRun" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AnalyticsTarget" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "processed_webhooks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ContentResource" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SocialPublishJob" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Post" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PostReaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PostComment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkflowTemplate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkflowStep" ENABLE ROW LEVEL SECURITY;
