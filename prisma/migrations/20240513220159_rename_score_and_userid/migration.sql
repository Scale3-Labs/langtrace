-- DropForeignKey
ALTER TABLE "Evaluation" DROP CONSTRAINT "Evaluation_userId_fkey";
-- AlterTable
ALTER TABLE "Evaluation"
  RENAME COLUMN "userId" TO "ltUserId";
ALTER TABLE "Evaluation"
  RENAME COLUMN "score" TO "ltUserScore";
ALTER TABLE "Evaluation"
ADD COLUMN "userId" TEXT,
  ADD COLUMN "userScore" INTEGER;
-- AddForeignKey
ALTER TABLE "Evaluation"
ADD CONSTRAINT "Evaluation_ltUserId_fkey" FOREIGN KEY ("ltUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;