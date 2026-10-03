-- Add missing indexes (hand-written; names follow Prisma's "Model_col1_col2_idx" rule).
-- Plain CREATE INDEX (not CONCURRENTLY) because prisma migrate runs in a transaction.
-- NOTE: the Post.tags GIN index and pg_trgm indexes are intentionally NOT included here.

CREATE INDEX IF NOT EXISTS "Task_contactId_status_idx" ON "Task"("contactId", "status");
CREATE INDEX IF NOT EXISTS "Task_inquiryId_idx" ON "Task"("inquiryId");
CREATE INDEX IF NOT EXISTS "Task_status_dueAt_idx" ON "Task"("status", "dueAt");
CREATE INDEX IF NOT EXISTS "Appointment_contactId_scheduledFor_idx" ON "Appointment"("contactId", "scheduledFor");
CREATE INDEX IF NOT EXISTS "Appointment_inquiryId_idx" ON "Appointment"("inquiryId");
CREATE INDEX IF NOT EXISTS "Appointment_calendlyEventId_idx" ON "Appointment"("calendlyEventId");
CREATE INDEX IF NOT EXISTS "Inquiry_leadSessionId_idx" ON "Inquiry"("leadSessionId");
CREATE INDEX IF NOT EXISTS "Inquiry_updatedAt_idx" ON "Inquiry"("updatedAt");
CREATE INDEX IF NOT EXISTS "Inquiry_stage_updatedAt_idx" ON "Inquiry"("stage", "updatedAt");
CREATE INDEX IF NOT EXISTS "Inquiry_contactId_createdAt_idx" ON "Inquiry"("contactId", "createdAt");
CREATE INDEX IF NOT EXISTS "Contact_updatedAt_idx" ON "Contact"("updatedAt");
CREATE INDEX IF NOT EXISTS "Contact_status_updatedAt_idx" ON "Contact"("status", "updatedAt");
CREATE INDEX IF NOT EXISTS "Event_leadSessionId_eventType_occurredAt_idx" ON "Event"("leadSessionId", "eventType", "occurredAt");
CREATE INDEX IF NOT EXISTS "Event_contactId_occurredAt_idx" ON "Event"("contactId", "occurredAt");
CREATE INDEX IF NOT EXISTS "Event_source_eventType_idx" ON "Event"("source", "eventType");
CREATE INDEX IF NOT EXISTS "SystemEvent_occurredAt_idx" ON "SystemEvent"("occurredAt");
CREATE INDEX IF NOT EXISTS "SystemEvent_contactId_occurredAt_idx" ON "SystemEvent"("contactId", "occurredAt");
CREATE INDEX IF NOT EXISTS "SystemEvent_type_leadSessionId_idx" ON "SystemEvent"("type", "leadSessionId");
CREATE INDEX IF NOT EXISTS "AiRun_createdAt_status_idx" ON "AiRun"("createdAt", "status");
CREATE INDEX IF NOT EXISTS "AiRun_contactId_createdAt_idx" ON "AiRun"("contactId", "createdAt");
CREATE INDEX IF NOT EXISTS "SocialMetric_metricDate_idx" ON "SocialMetric"("metricDate");
CREATE INDEX IF NOT EXISTS "SocialPost_status_publishedAt_idx" ON "SocialPost"("status", "publishedAt");
CREATE INDEX IF NOT EXISTS "SocialPost_createdAt_idx" ON "SocialPost"("createdAt");
CREATE INDEX IF NOT EXISTS "ConversationThread_lastMessageAt_idx" ON "ConversationThread"("lastMessageAt");
CREATE INDEX IF NOT EXISTS "CalendarEvent_appointmentId_idx" ON "CalendarEvent"("appointmentId");
CREATE INDEX IF NOT EXISTS "CalendarEvent_status_startAt_idx" ON "CalendarEvent"("status", "startAt");

-- ConversationMessage: replace single-column contactId index with (contactId, createdAt)
DROP INDEX IF EXISTS "ConversationMessage_contactId_idx";
CREATE INDEX IF NOT EXISTS "ConversationMessage_contactId_createdAt_idx" ON "ConversationMessage"("contactId", "createdAt");
