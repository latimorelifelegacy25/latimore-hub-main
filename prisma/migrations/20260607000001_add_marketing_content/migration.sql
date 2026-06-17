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

-- CreateIndex
CREATE INDEX "MarketingContent_status_idx" ON "MarketingContent"("status");

-- CreateIndex
CREATE INDEX "MarketingContent_type_idx" ON "MarketingContent"("type");

-- CreateIndex
CREATE INDEX "MarketingContent_campaign_idx" ON "MarketingContent"("campaign");

-- CreateIndex
CREATE INDEX "MarketingContent_createdAt_idx" ON "MarketingContent"("createdAt");
