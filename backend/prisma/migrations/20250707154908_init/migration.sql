/*
  Warnings:

  - Added the required column `type` to the `BidEvent` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BidEventType" AS ENUM ('BASE_PRICE', 'BID_PLACED', 'WINNER_SELECTED');

-- AlterTable
ALTER TABLE "BidEvent" ADD COLUMN     "type" "BidEventType" NOT NULL;
