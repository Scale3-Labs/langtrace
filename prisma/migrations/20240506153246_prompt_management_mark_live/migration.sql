/*
  Warnings:

  - You are about to drop the column `approved` on the `Prompt` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Prompt" DROP COLUMN "approved",
ADD COLUMN     "live" BOOLEAN NOT NULL DEFAULT false;
