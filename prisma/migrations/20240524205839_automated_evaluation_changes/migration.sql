-- AlterTable
ALTER TABLE "Data" ADD COLUMN     "contexts" TEXT[],
ADD COLUMN     "expectedOutput" TEXT,
ADD COLUMN     "runId" TEXT,
ALTER COLUMN "datasetId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Evaluation" ADD COLUMN     "dataId" TEXT,
ADD COLUMN     "reason" TEXT;

-- AlterTable
ALTER TABLE "Test" ADD COLUMN     "evaluationCriteria" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'manual';

-- CreateTable
CREATE TABLE "Run" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Run_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_dataId_fkey" FOREIGN KEY ("dataId") REFERENCES "Data"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Data" ADD CONSTRAINT "Data_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE CASCADE ON UPDATE CASCADE;
