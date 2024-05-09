-- AlterTable
ALTER TABLE "Prompt" ADD COLUMN     "model" TEXT,
ADD COLUMN     "modelSettings" JSONB DEFAULT '{}',
ADD COLUMN     "variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "version" TEXT DEFAULT '1.0.0';
