-- CreateTable
CREATE TABLE "TrackingLink" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "label" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "utmTerm" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "TrackingLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackingClick" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referrer" TEXT,
    "userAgent" TEXT,
    "ipHash" TEXT,

    CONSTRAINT "TrackingClick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrackingLink_slug_key" ON "TrackingLink"("slug");

-- CreateIndex
CREATE INDEX "TrackingClick_linkId_occurredAt_idx" ON "TrackingClick"("linkId", "occurredAt");

-- CreateIndex
CREATE INDEX "TrackingClick_slug_idx" ON "TrackingClick"("slug");

-- AddForeignKey
ALTER TABLE "TrackingClick" ADD CONSTRAINT "TrackingClick_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "TrackingLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Prisma connects with a BYPASSRLS role; enabling RLS only blocks the
-- Supabase anon/authenticated PostgREST exposure (same as other tables).
ALTER TABLE public."TrackingLink" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TrackingClick" ENABLE ROW LEVEL SECURITY;

INSERT INTO public._prisma_migrations (id,checksum,migration_name,started_at,finished_at,applied_steps_count) VALUES (gen_random_uuid()::text,'978247a2af0d257b99a26944c2f019cf07215978a01f0488c12853ccfa2476c5','20261006120000_add_tracking_links',now(),now(),1);
