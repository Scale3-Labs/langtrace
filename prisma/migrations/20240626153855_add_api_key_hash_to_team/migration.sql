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

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "apiKeyHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Team_apiKeyHash_key" ON "Team"("apiKeyHash");

