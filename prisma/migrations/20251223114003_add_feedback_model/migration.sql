-- CreateTable
CREATE TABLE "InterviewFeedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scoringAccuracy" INTEGER NOT NULL,
    "questionRealism" BOOLEAN NOT NULL,
    "wouldRetake" BOOLEAN NOT NULL,
    "wouldRecommend" INTEGER NOT NULL,
    "overallRating" INTEGER NOT NULL,
    "improvements" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InterviewFeedback_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InterviewSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "InterviewFeedback_sessionId_key" ON "InterviewFeedback"("sessionId");
