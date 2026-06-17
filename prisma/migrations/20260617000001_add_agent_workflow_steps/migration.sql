-- CreateEnum
CREATE TYPE "AgentStepStatus" AS ENUM ('pending', 'running', 'succeeded', 'failed');

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

-- CreateIndex
CREATE INDEX "AgentWorkflowStep_aiRunId_order_idx" ON "AgentWorkflowStep"("aiRunId", "order");

-- CreateIndex
CREATE INDEX "AgentWorkflowStep_status_idx" ON "AgentWorkflowStep"("status");

-- AddForeignKey
ALTER TABLE "AgentWorkflowStep" ADD CONSTRAINT "AgentWorkflowStep_aiRunId_fkey" FOREIGN KEY ("aiRunId") REFERENCES "AiRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
