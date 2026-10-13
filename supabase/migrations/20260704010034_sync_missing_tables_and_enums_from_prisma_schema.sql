-- Sync production DB with prisma/schema.prisma: missing enums, enum values, and 10 missing tables

-- Missing enum values on existing enums
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'legacy_checkup_started';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'legacy_checkup_step_completed';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'legacy_checkup_completed';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'lead_submitted';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'book_consultation_clicked';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'instant_quote_clicked';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'service_card_clicked';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'gbp_service_visit';
ALTER TYPE "AiRunType" ADD VALUE IF NOT EXISTS 'content_repurposing';
ALTER TYPE "AiRunType" ADD VALUE IF NOT EXISTS 'crm_assistant';
ALTER TYPE "AiRunType" ADD VALUE IF NOT EXISTS 'agent_workflow';

-- Missing enums
CREATE TYPE "AdminRole" AS ENUM ('ADMIN', 'REVIEWER', 'AGENT');
CREATE TYPE "AgentStepStatus" AS ENUM ('pending', 'running', 'succeeded', 'failed');

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'AGENT',
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegacyCheckupAssessment" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contactId" TEXT NOT NULL,
    "inquiryId" TEXT,
    "hasLifeInsurance" BOOLEAN,
    "hasMortgageProtection" BOOLEAN,
    "hasFinalExpense" BOOLEAN,
    "hasRetirementPlan" BOOLEAN,
    "hasLegacyPlan" BOOLEAN,
    "interestedIn" TEXT[],
    "message" TEXT,

    CONSTRAINT "LegacyCheckupAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentWorkflowStep" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "aiRunId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "agentRole" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "status" "AgentStepStatus" NOT NULL DEFAULT 'pending',
    "output" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AgentWorkflowStep_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "MarketingContent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "campaign" TEXT,
    "destination" TEXT,
    "utmSource" TEXT,
    "type" TEXT NOT NULL DEFAULT 'post',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialAccountMetric" (
    "id" TEXT NOT NULL,
    "provider" "SocialProvider" NOT NULL,
    "externalId" TEXT NOT NULL,
    "metricDate" TIMESTAMP(3) NOT NULL,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "profileViews" INTEGER NOT NULL DEFAULT 0,
    "engagedUsers" INTEGER NOT NULL DEFAULT 0,
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialAccountMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processed_webhooks" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentResource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "bodyHtml" TEXT,
    "campaign" TEXT,
    "destination" TEXT,
    "utmSource" TEXT,
    "publishAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialPublishJob" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "scheduledFor" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contentId" TEXT NOT NULL,

    CONSTRAINT "SocialPublishJob_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");
CREATE INDEX "AdminUser_role_idx" ON "AdminUser"("role");
CREATE INDEX "AdminUser_active_idx" ON "AdminUser"("active");
CREATE INDEX "LegacyCheckupAssessment_contactId_idx" ON "LegacyCheckupAssessment"("contactId");
CREATE INDEX "LegacyCheckupAssessment_inquiryId_idx" ON "LegacyCheckupAssessment"("inquiryId");
CREATE INDEX "LegacyCheckupAssessment_createdAt_idx" ON "LegacyCheckupAssessment"("createdAt");
CREATE INDEX "AgentWorkflowStep_aiRunId_order_idx" ON "AgentWorkflowStep"("aiRunId", "order");
CREATE INDEX "AgentWorkflowStep_status_idx" ON "AgentWorkflowStep"("status");
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
CREATE INDEX "MarketingContent_status_idx" ON "MarketingContent"("status");
CREATE INDEX "MarketingContent_type_idx" ON "MarketingContent"("type");
CREATE INDEX "MarketingContent_campaign_idx" ON "MarketingContent"("campaign");
CREATE INDEX "MarketingContent_createdAt_idx" ON "MarketingContent"("createdAt");
CREATE INDEX "SocialAccountMetric_provider_metricDate_idx" ON "SocialAccountMetric"("provider", "metricDate");
CREATE UNIQUE INDEX "SocialAccountMetric_provider_externalId_metricDate_key" ON "SocialAccountMetric"("provider", "externalId", "metricDate");
CREATE INDEX "processed_webhooks_processedAt_idx" ON "processed_webhooks"("processedAt");
CREATE UNIQUE INDEX "processed_webhooks_provider_eventId_key" ON "processed_webhooks"("provider", "eventId");
CREATE INDEX "ContentResource_status_createdAt_idx" ON "ContentResource"("status", "createdAt");
CREATE INDEX "ContentResource_campaign_idx" ON "ContentResource"("campaign");
CREATE INDEX "ContentResource_publishAt_idx" ON "ContentResource"("publishAt");
CREATE INDEX "SocialPublishJob_platform_idx" ON "SocialPublishJob"("platform");
CREATE INDEX "SocialPublishJob_status_scheduledFor_idx" ON "SocialPublishJob"("status", "scheduledFor");
CREATE INDEX "SocialPublishJob_contentId_idx" ON "SocialPublishJob"("contentId");
ALTER TABLE "LegacyCheckupAssessment" ADD CONSTRAINT "LegacyCheckupAssessment_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LegacyCheckupAssessment" ADD CONSTRAINT "LegacyCheckupAssessment_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgentWorkflowStep" ADD CONSTRAINT "AgentWorkflowStep_aiRunId_fkey" FOREIGN KEY ("aiRunId") REFERENCES "AiRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JoinApplication" ADD CONSTRAINT "JoinApplication_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "JoinApplication" ADD CONSTRAINT "JoinApplication_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "JoinFormEvent" ADD CONSTRAINT "JoinFormEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JoinApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SocialPublishJob" ADD CONSTRAINT "SocialPublishJob_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "ContentResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS to match the rest of the schema (Prisma connects as table owner and is unaffected)
ALTER TABLE "AdminUser" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LegacyCheckupAssessment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AgentWorkflowStep" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "JoinApplication" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "JoinFormEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MarketingContent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SocialAccountMetric" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "processed_webhooks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ContentResource" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SocialPublishJob" ENABLE ROW LEVEL SECURITY;
