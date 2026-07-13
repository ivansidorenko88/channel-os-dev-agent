-- CreateEnum
CREATE TYPE "DraftStatus" AS ENUM ('DRAFT', 'APPROVED', 'PUBLISHED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('MANUAL', 'NEWS', 'HUMOR', 'DEVLOG');

-- CreateTable
CREATE TABLE "ContentDraft" (
    "id" SERIAL NOT NULL,
    "type" "ContentType" NOT NULL DEFAULT 'MANUAL',
    "topic" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "visualIdea" TEXT,
    "status" "DraftStatus" NOT NULL DEFAULT 'DRAFT',
    "telegramMessageId" INTEGER,
    "publishedMessageId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "ContentDraft_pkey" PRIMARY KEY ("id")
);
