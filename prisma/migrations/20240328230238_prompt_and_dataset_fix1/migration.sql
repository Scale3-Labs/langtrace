/*
  Warnings:

  - You are about to drop the column `type` on the `Dataset` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Promptset` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Dataset" DROP COLUMN "type";

-- AlterTable
ALTER TABLE "Promptset" DROP COLUMN "type";

-- DropEnum
DROP TYPE "DatasetType";
