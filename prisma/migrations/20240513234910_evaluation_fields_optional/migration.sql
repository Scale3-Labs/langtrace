-- Remove columns
ALTER TABLE "Evaluation" DROP COLUMN "model",
  DROP COLUMN "prompt",
  DROP COLUMN "spanStartTime";
-- Alter columns to be nullable
ALTER TABLE "Evaluation"
ALTER COLUMN "ltUserId" DROP NOT NULL,
  ALTER COLUMN "ltUserScore" DROP NOT NULL,
  ALTER COLUMN "testId" DROP NOT NULL;