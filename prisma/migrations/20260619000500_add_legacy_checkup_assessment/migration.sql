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
  CONSTRAINT "LegacyCheckupAssessment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LegacyCheckupAssessment_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "LegacyCheckupAssessment_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "LegacyCheckupAssessment_contactId_idx"
  ON "LegacyCheckupAssessment"("contactId");

CREATE INDEX IF NOT EXISTS "LegacyCheckupAssessment_inquiryId_idx"
  ON "LegacyCheckupAssessment"("inquiryId");

CREATE INDEX IF NOT EXISTS "LegacyCheckupAssessment_createdAt_idx"
  ON "LegacyCheckupAssessment"("createdAt");
