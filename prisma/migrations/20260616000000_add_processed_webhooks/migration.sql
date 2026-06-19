-- CreateTable
CREATE TABLE "processed_webhooks" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "processed_webhooks_processedAt_idx" ON "processed_webhooks"("processedAt");

-- CreateIndex
CREATE UNIQUE INDEX "processed_webhooks_provider_eventId_key" ON "processed_webhooks"("provider", "eventId");
