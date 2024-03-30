/*
  Warnings:

  - You are about to drop the `DeveloperFeedback` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "DeveloperFeedback" DROP CONSTRAINT "DeveloperFeedback_userId_fkey";

-- DropTable
DROP TABLE "DeveloperFeedback";

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL,
    "spanId" TEXT,
    "traceId" TEXT,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
