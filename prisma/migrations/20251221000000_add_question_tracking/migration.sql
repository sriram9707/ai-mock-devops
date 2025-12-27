-- AlterTable
ALTER TABLE "InterviewTurn" ADD COLUMN "isQuestion" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "InterviewTurn" ADD COLUMN "questionHash" TEXT;

