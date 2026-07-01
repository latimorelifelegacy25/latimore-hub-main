-- Add role-aware admin users for server-side RBAC.
CREATE TYPE "AdminRole" AS ENUM ('ADMIN', 'REVIEWER', 'AGENT');

CREATE TABLE "AdminUser" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "email" TEXT NOT NULL,
  "role" "AdminRole" NOT NULL DEFAULT 'AGENT',
  "active" BOOLEAN NOT NULL DEFAULT true,

  CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");
CREATE INDEX "AdminUser_role_idx" ON "AdminUser"("role");
CREATE INDEX "AdminUser_active_idx" ON "AdminUser"("active");
