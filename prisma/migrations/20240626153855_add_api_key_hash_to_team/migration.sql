-- AlterTable
ALTER TABLE "Team" ADD COLUMN "apiKeyHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Team_apiKeyHash_key" ON "Team"("apiKeyHash");

