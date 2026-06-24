-- CreateTable
CREATE TABLE "JoinApplication" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contactId" TEXT NOT NULL,
    "inquiryId" TEXT,
    "fullName" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cityState" TEXT,
    "bestContactMethod" TEXT,
    "bestContactTime" TEXT,
    "interestReason" TEXT,
    "lookingFor" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "selfDescription" TEXT,
    "licenseStatus" TEXT,
    "licensesHeld" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "priorExperience" TEXT,
    "experienceDescription" TEXT,
    "incomeGoal" TEXT,
    "hoursPerWeek" TEXT,
    "comfortLevel" INTEGER,
    "willingToTrain" TEXT,
    "motivation" TEXT,
    "values" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mentorshipNeeds" TEXT,
    "availableForCall" TEXT,
    "preferredCallTime" TEXT,
    "questions" TEXT,
    "consentAccepted" BOOLEAN NOT NULL DEFAULT false,
    "consentText" TEXT,
    "leadSessionId" TEXT,
    "pageUrl" TEXT,
    "referrer" TEXT,
    "source" TEXT,
    "medium" TEXT,
    "campaign" TEXT,
    "status" TEXT NOT NULL DEFAULT 'New',
    CONSTRAINT "JoinApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JoinFormEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applicationId" TEXT,
    "leadSessionId" TEXT,
    "eventType" TEXT NOT NULL,
    "pageUrl" TEXT,
    "referrer" TEXT,
    "source" TEXT,
    "medium" TEXT,
    "campaign" TEXT,
    "metadata" JSONB,
    CONSTRAINT "JoinFormEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "JoinApplication_createdAt_idx" ON "JoinApplication"("createdAt");
CREATE INDEX "JoinApplication_contactId_idx" ON "JoinApplication"("contactId");
CREATE INDEX "JoinApplication_inquiryId_idx" ON "JoinApplication"("inquiryId");
CREATE INDEX "JoinApplication_status_idx" ON "JoinApplication"("status");
CREATE INDEX "JoinApplication_source_medium_campaign_idx" ON "JoinApplication"("source", "medium", "campaign");
CREATE INDEX "JoinApplication_leadSessionId_idx" ON "JoinApplication"("leadSessionId");
CREATE INDEX "JoinFormEvent_createdAt_idx" ON "JoinFormEvent"("createdAt");
CREATE INDEX "JoinFormEvent_applicationId_idx" ON "JoinFormEvent"("applicationId");
CREATE INDEX "JoinFormEvent_leadSessionId_idx" ON "JoinFormEvent"("leadSessionId");
CREATE INDEX "JoinFormEvent_eventType_idx" ON "JoinFormEvent"("eventType");
ALTER TABLE "JoinApplication" ADD CONSTRAINT "JoinApplication_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "JoinApplication" ADD CONSTRAINT "JoinApplication_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "JoinFormEvent" ADD CONSTRAINT "JoinFormEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JoinApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;
