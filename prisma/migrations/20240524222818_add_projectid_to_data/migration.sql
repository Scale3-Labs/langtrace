-- AlterTable
ALTER TABLE "Data" ADD COLUMN     "projectId" TEXT;

-- AddForeignKey
ALTER TABLE "Data" ADD CONSTRAINT "Data_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
