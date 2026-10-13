
-- Enforce Calendly webhook idempotency at the database level.
-- Prevents duplicate Appointment rows from Calendly retry deliveries.
CREATE UNIQUE INDEX IF NOT EXISTS "Appointment_calendlyEventId_key"
ON "Appointment" ("calendlyEventId")
WHERE "calendlyEventId" IS NOT NULL;
