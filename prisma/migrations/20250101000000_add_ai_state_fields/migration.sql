-- AlterTable
-- Add systemPrompt and interviewState fields to InterviewSession
-- These fields are used for stateful AI interview management

ALTER TABLE "InterviewSession" ADD COLUMN "systemPrompt" TEXT;
ALTER TABLE "InterviewSession" ADD COLUMN "interviewState" TEXT;

