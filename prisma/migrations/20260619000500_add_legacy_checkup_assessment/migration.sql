CREATE TABLE IF NOT EXISTS "LegacyCheckupAssessment" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "contactId" TEXT NOT NULL,
  "inquiryId" TEXT,
  "hasLifeInsurance" BOOLEAN,
  "hasMortgageProtection" BOOLEAN,
  "hasFinalExpense" BOOLEAN,
  "hasRetirementPlan" BOOLEAN,
  "hasLegacyPlan" BOOLEAN,
  "interestedIn" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "message" TEXT,
  CONSTRAINT "LegacyCheckupAssessment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LegacyCheckupAssessment_contactId_idx"
  ON "LegacyCheckupAssessment"("contactId");

CREATE INDEX IF NOT EXISTS "LegacyCheckupAssessment_inquiryId_idx"
  ON "LegacyCheckupAssessment"("inquiryId");

CREATE INDEX IF NOT EXISTS "LegacyCheckupAssessment_createdAt_idx"
  ON "LegacyCheckupAssessment"("createdAt");
