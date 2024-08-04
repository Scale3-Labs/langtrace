/*
  Warnings:

  - You are about to drop the column `annotatedOutput` on the `Data` table. All the data in the column will be lost.
  - You are about to drop the column `contexts` on the `Data` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Data" DROP COLUMN "annotatedOutput",
DROP COLUMN "contexts",
ADD COLUMN     "expectedOutput" TEXT,
ADD COLUMN     "model" TEXT;
