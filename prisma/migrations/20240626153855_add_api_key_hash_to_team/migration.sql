/*
  Warnings:

  - You are about to drop the column `expectedOutput` on the `Data` table. All the data in the column will be lost.
  - You are about to drop the column `runId` on the `Data` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Run` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[apiKeyHash]` on the table `Team` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `projectId` to the `Run` table without a default value. This is not possible if the table is not empty.
  - Added the required column `runId` to the `Run` table without a default value. This is not possible if the table is not empty.
  - Added the required column `taskId` to the `Run` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Run` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Data" DROP CONSTRAINT "Data_runId_fkey";

-- AlterTable
ALTER TABLE "Data" DROP COLUMN "expectedOutput",
DROP COLUMN "runId",
ADD COLUMN     "annotatedOutput" TEXT;

-- AlterTable
ALTER TABLE "Run" DROP COLUMN "name",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "datasetId" TEXT,
ADD COLUMN     "log" JSONB,
ADD COLUMN     "projectId" TEXT NOT NULL,
ADD COLUMN     "runId" TEXT NOT NULL,
ADD COLUMN     "taskId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "wfVersion" TEXT;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "apiKeyHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Team_apiKeyHash_key" ON "Team"("apiKeyHash");

-- AddForeignKey
ALTER TABLE "Run" ADD CONSTRAINT "Run_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Run" ADD CONSTRAINT "Run_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
