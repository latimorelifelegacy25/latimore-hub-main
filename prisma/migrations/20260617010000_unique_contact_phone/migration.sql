-- Enforce true phone uniqueness for lead deduplication.
DROP INDEX IF EXISTS "Contact_phone_idx";
CREATE UNIQUE INDEX "Contact_phone_key" ON "Contact"("phone") WHERE "phone" IS NOT NULL;
