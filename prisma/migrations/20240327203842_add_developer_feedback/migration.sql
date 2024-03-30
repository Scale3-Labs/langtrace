-- CreateTable
CREATE TABLE "DeveloperFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "feedbackRating" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeveloperFeedback_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DeveloperFeedback" ADD CONSTRAINT "DeveloperFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
