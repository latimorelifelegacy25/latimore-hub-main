-- Extend the existing legacy checkup assessment table so Product Fit submissions
-- can keep quiz answers, attribution, selected product, and recommendation data.

ALTER TABLE "LegacyCheckupAssessment"
  ADD COLUMN IF NOT EXISTS "leadSessionId" TEXT,
  ADD COLUMN IF NOT EXISTS "lifeStage" TEXT,
  ADD COLUMN IF NOT EXISTS "state" TEXT,
  ADD COLUMN IF NOT EXISTS "county" TEXT,
  ADD COLUMN IF NOT EXISTS "timeline" TEXT,
  ADD COLUMN IF NOT EXISTS "bestContactTime" TEXT,
  ADD COLUMN IF NOT EXISTS "selectedProductSlug" TEXT,
  ADD COLUMN IF NOT EXISTS "recommendedPrimary" TEXT,
  ADD COLUMN IF NOT EXISTS "recommendedSecondary" TEXT,
  ADD COLUMN IF NOT EXISTS "score" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "answers" JSONB,
  ADD COLUMN IF NOT EXISTS "attribution" JSONB;

CREATE INDEX IF NOT EXISTS "LegacyCheckupAssessment_leadSessionId_idx"
  ON "LegacyCheckupAssessment"("leadSessionId");

CREATE INDEX IF NOT EXISTS "LegacyCheckupAssessment_recommendedPrimary_idx"
  ON "LegacyCheckupAssessment"("recommendedPrimary");

DO $$
BEGIN
  ALTER TABLE "LegacyCheckupAssessment"
    ADD CONSTRAINT "LegacyCheckupAssessment_leadSessionId_fkey"
    FOREIGN KEY ("leadSessionId") REFERENCES "LeadSession"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
