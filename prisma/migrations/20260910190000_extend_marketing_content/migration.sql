-- Extend MarketingContent with the fields the Content Repository UI needs:
-- import source/domain, full UTM set, article authoring metadata, and
-- real deploy tracking. All additive/nullable — no data loss, no drops.

ALTER TABLE "MarketingContent"
  ADD COLUMN "sourceUrl" TEXT,
  ADD COLUMN "domain" TEXT,
  ADD COLUMN "utmMedium" TEXT,
  ADD COLUMN "utmContent" TEXT,
  ADD COLUMN "author" TEXT,
  ADD COLUMN "category" TEXT,
  ADD COLUMN "coverImageUrl" TEXT,
  ADD COLUMN "slug" TEXT,
  ADD COLUMN "fileName" TEXT,
  ADD COLUMN "fileSizeBytes" INTEGER,
  ADD COLUMN "scheduledFor" TIMESTAMP(3),
  ADD COLUMN "publishedAt" TIMESTAMP(3),
  ADD COLUMN "deployId" TEXT,
  ADD COLUMN "deployStatus" TEXT,
  ADD COLUMN "deployUrl" TEXT;

CREATE INDEX "MarketingContent_slug_idx" ON "MarketingContent"("slug");
