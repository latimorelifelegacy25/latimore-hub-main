-- Account-level daily social metrics (followers, reach, impressions) populated by
-- the Facebook/Instagram insights sync cron, keyed by provider + the connected
-- account's external platform id.

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

CREATE UNIQUE INDEX "SocialAccountMetric_provider_externalId_metricDate_key"
  ON "SocialAccountMetric"("provider", "externalId", "metricDate");

CREATE INDEX "SocialAccountMetric_provider_metricDate_idx"
  ON "SocialAccountMetric"("provider", "metricDate");
