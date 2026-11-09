/*
  Warnings:

  - You are about to drop the column `imageHeight` on the `Analysis` table. All the data in the column will be lost.
  - You are about to drop the column `imageKey` on the `Analysis` table. All the data in the column will be lost.
  - You are about to drop the column `imageMime` on the `Analysis` table. All the data in the column will be lost.
  - You are about to drop the column `imageWidth` on the `Analysis` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Analysis" DROP COLUMN "imageHeight",
DROP COLUMN "imageKey",
DROP COLUMN "imageMime",
DROP COLUMN "imageWidth",
ADD COLUMN     "imageId" TEXT;

-- CreateTable
CREATE TABLE "ChartImage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "originalBytes" INTEGER NOT NULL,
    "purgedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChartImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "key" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key","windowStart")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChartImage_storageKey_key" ON "ChartImage"("storageKey");

-- CreateIndex
CREATE INDEX "ChartImage_userId_createdAt_idx" ON "ChartImage"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ChartImage_userId_sha256_idx" ON "ChartImage"("userId", "sha256");

-- CreateIndex
CREATE INDEX "RateLimit_windowStart_idx" ON "RateLimit"("windowStart");

-- AddForeignKey
ALTER TABLE "Analysis" ADD CONSTRAINT "Analysis_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "ChartImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChartImage" ADD CONSTRAINT "ChartImage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
