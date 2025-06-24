/*
  Warnings:

  - The `status` column on the `Bid` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "BidStatus" AS ENUM ('PENDING', 'APPROVED', 'LIVE', 'CLOSED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Bid" DROP COLUMN "status",
ADD COLUMN     "status" "BidStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "BidParticipant_bidId_userId_idx" ON "BidParticipant"("bidId", "userId");
