create index if not exists "AIAnalysis_commentId_idx" on public."AIAnalysis" ("commentId");
create index if not exists "AiRun_inquiryId_idx" on public."AiRun" ("inquiryId");
create index if not exists "Appointment_contactId_idx" on public."Appointment" ("contactId");
create index if not exists "Appointment_inquiryId_idx" on public."Appointment" ("inquiryId");
create index if not exists "CalendarEvent_appointmentId_idx" on public."CalendarEvent" ("appointmentId");
create index if not exists "CalendarEvent_inquiryId_idx" on public."CalendarEvent" ("inquiryId");
create index if not exists "ConversationMessage_inquiryId_idx" on public."ConversationMessage" ("inquiryId");
create index if not exists "ConversationThread_inquiryId_idx" on public."ConversationThread" ("inquiryId");
create index if not exists "Inquiry_leadSessionId_idx" on public."Inquiry" ("leadSessionId");
create index if not exists "Insight_postId_idx" on public."Insight" ("postId");
create index if not exists "SocialPost_accountId_idx" on public."SocialPost" ("accountId");
create index if not exists "SystemEvent_leadSessionId_idx" on public."SystemEvent" ("leadSessionId");
create index if not exists "SystemEvent_threadId_idx" on public."SystemEvent" ("threadId");
create index if not exists "Task_contactId_idx" on public."Task" ("contactId");
create index if not exists "Task_inquiryId_idx" on public."Task" ("inquiryId");

drop policy if exists service_role_all on public."AiRun";
create policy service_role_all on public."AiRun" for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');

drop policy if exists service_role_all on public."Appointment";
create policy service_role_all on public."Appointment" for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');

drop policy if exists service_role_all on public."CalendarConnection";
create policy service_role_all on public."CalendarConnection" for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');

drop policy if exists service_role_all on public."CalendarEvent";
create policy service_role_all on public."CalendarEvent" for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');

drop policy if exists service_role_all on public."Contact";
create policy service_role_all on public."Contact" for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');

drop policy if exists service_role_all on public."ContentAsset";
create policy service_role_all on public."ContentAsset" for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');

drop policy if exists service_role_all on public."ConversationMessage";
create policy service_role_all on public."ConversationMessage" for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');

drop policy if exists service_role_all on public."ConversationThread";
create policy service_role_all on public."ConversationThread" for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');

drop policy if exists service_role_all on public."EmailLog";
create policy service_role_all on public."EmailLog" for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');

drop policy if exists service_role_all on public."Event";
create policy service_role_all on public."Event" for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');

drop policy if exists service_role_all on public."Inquiry";
create policy service_role_all on public."Inquiry" for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');

drop policy if exists service_role_all on public."InquiryStageHistory";
create policy service_role_all on public."InquiryStageHistory" for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');

drop policy if exists service_role_all on public."LeadSession";
create policy service_role_all on public."LeadSession" for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');

drop policy if exists service_role_all on public."Note";
create policy service_role_all on public."Note" for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');

drop policy if exists service_role_all on public."SystemEvent";
create policy service_role_all on public."SystemEvent" for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');

drop policy if exists service_role_all on public."Task";
create policy service_role_all on public."Task" for all using ((select auth.role()) = 'service_role') with check ((select auth.role()) = 'service_role');
