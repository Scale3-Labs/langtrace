/*
  Warnings:

  - You are about to drop the column `datasetId` on the `Evaluation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Evaluation" DROP COLUMN "datasetId",
ADD COLUMN     "addedToDataset" BOOLEAN DEFAULT false;
