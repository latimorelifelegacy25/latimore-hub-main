-- Replace broad public policies on legacy lowercase tables with service-role-only access.
drop policy if exists allow_all_activities on public.activities;
create policy service_role_all on public.activities for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');

drop policy if exists allow_all_contacts on public.contacts;
create policy service_role_all on public.contacts for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');

drop policy if exists allow_all_contents on public.contents;
create policy service_role_all on public.contents for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');

drop policy if exists allow_all_deals on public.deals;
create policy service_role_all on public.deals for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');

drop policy if exists allow_all_social_accounts on public.social_accounts;
create policy service_role_all on public.social_accounts for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');

drop policy if exists allow_all_social_posts on public.social_posts;
create policy service_role_all on public.social_posts for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');

drop policy if exists "Allow insert for everyone" on public.leads;
drop policy if exists "Allow read for authenticated users" on public.leads;
create policy service_role_all on public.leads for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');

drop policy if exists "Allow anonymous inserts" on public.tracking_events;
drop policy if exists "Allow read for authenticated users" on public.tracking_events;
create policy service_role_all on public.tracking_events for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');

-- Add explicit service-role-only policies to public tables that had RLS enabled but no policies.
create policy service_role_all on public."AIAnalysis" for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');
create policy service_role_all on public."AnalyticsBreakdownDaily" for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');
create policy service_role_all on public."AnalyticsDailyMetric" for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');
create policy service_role_all on public."AnalyticsFunnelDaily" for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');
create policy service_role_all on public."AnalyticsJobRun" for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');
create policy service_role_all on public."AnalyticsTarget" for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');
create policy service_role_all on public."AutomationRule" for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');
create policy service_role_all on public."Insight" for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');
create policy service_role_all on public."Post" for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');
create policy service_role_all on public."PostComment" for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');
create policy service_role_all on public."PostReaction" for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');
create policy service_role_all on public."SocialAccount" for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');
create policy service_role_all on public."SocialComment" for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');
create policy service_role_all on public."SocialConnection" for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');
create policy service_role_all on public."SocialMetric" for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');
create policy service_role_all on public."SocialPost" for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');
create policy service_role_all on public."SocialTemplate" for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');
create policy service_role_all on public."SocialTemplateUsage" for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');
create policy service_role_all on public."UploadedWorkDocument" for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');
create policy service_role_all on public."WeeklyReport" for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');
create policy service_role_all on public."WorkflowStep" for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');
create policy service_role_all on public."WorkflowTemplate" for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');
create policy service_role_all on public.analytics_events for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');

-- Keep Prisma migration metadata inaccessible through client API roles.
revoke all on table public._prisma_migrations from anon, authenticated;

-- Remove client API access from foreign tables flagged by Supabase advisors.
revoke all on table public."Jackson " from anon, authenticated;
revoke all on table public."Blog " from anon, authenticated;
revoke all on table public."Latimore OS" from anon, authenticated;
