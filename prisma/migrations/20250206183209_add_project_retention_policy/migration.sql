-- CreateTable
CREATE TABLE "ProjectRetentionPolicy" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "retentionDays" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "lastRunJob" TIMESTAMP(3),

    CONSTRAINT "ProjectRetentionPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectRetentionPolicy_projectId_key" ON "ProjectRetentionPolicy"("projectId");

-- CreateIndex
CREATE INDEX "projectRetentionPolicy_projectId_idx" ON "ProjectRetentionPolicy"("projectId");

-- AddForeignKey
ALTER TABLE "ProjectRetentionPolicy" ADD CONSTRAINT "ProjectRetentionPolicy_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
