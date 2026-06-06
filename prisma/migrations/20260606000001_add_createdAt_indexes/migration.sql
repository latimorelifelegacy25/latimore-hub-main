-- Add missing createdAt/occurredAt indexes for analytics dashboard queries

CREATE INDEX IF NOT EXISTS "Contact_createdAt_idx" ON "Contact"("createdAt");
CREATE INDEX IF NOT EXISTS "Inquiry_createdAt_idx" ON "Inquiry"("createdAt");
CREATE INDEX IF NOT EXISTS "Appointment_createdAt_idx" ON "Appointment"("createdAt");
CREATE INDEX IF NOT EXISTS "Event_occurredAt_idx" ON "Event"("occurredAt");
