/*
  Warnings:

  - You are about to drop the column `addedToDataset` on the `Evaluation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Data" ADD COLUMN     "spanId" TEXT;

-- AlterTable
ALTER TABLE "Evaluation" DROP COLUMN "addedToDataset";

-- AlterTable
ALTER TABLE "Prompt" ADD COLUMN     "spanId" TEXT;
