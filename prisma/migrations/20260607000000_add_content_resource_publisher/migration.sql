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

-- CreateIndex
CREATE INDEX "ContentResource_status_createdAt_idx" ON "ContentResource"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ContentResource_campaign_idx" ON "ContentResource"("campaign");

-- CreateIndex
CREATE INDEX "ContentResource_publishAt_idx" ON "ContentResource"("publishAt");

-- CreateIndex
CREATE INDEX "SocialPublishJob_platform_idx" ON "SocialPublishJob"("platform");

-- CreateIndex
CREATE INDEX "SocialPublishJob_status_scheduledFor_idx" ON "SocialPublishJob"("status", "scheduledFor");

-- CreateIndex
CREATE INDEX "SocialPublishJob_contentId_idx" ON "SocialPublishJob"("contentId");

-- AddForeignKey
ALTER TABLE "SocialPublishJob" ADD CONSTRAINT "SocialPublishJob_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "ContentResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
