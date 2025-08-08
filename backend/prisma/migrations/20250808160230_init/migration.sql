-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "registrationNumber" TEXT,
    "taxId" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "gstCertificatePath" TEXT NOT NULL,
    "panCardPath" TEXT NOT NULL,
    "bankDocumentPath" TEXT NOT NULL,
    "authorizedSignatoryPath" TEXT,
    "companyRegistrationPath" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Bid" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lotName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "wasteType" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "basePrice" REAL NOT NULL,
    "minIncrementPercent" REAL NOT NULL DEFAULT 0,
    "currentPrice" REAL NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "creatorId" TEXT NOT NULL,
    "winnerId" TEXT,
    "gatePassPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Bid_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Bid_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BidImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bidId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    CONSTRAINT "BidImage_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "Bid" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BidParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bidId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BidParticipant_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "Bid" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BidParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BidEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bidId" TEXT NOT NULL,
    "userId" TEXT,
    "amount" REAL NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BidEvent_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "Bid" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BidEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserDocument_userId_key" ON "UserDocument"("userId");

-- CreateIndex
CREATE INDEX "BidParticipant_bidId_userId_idx" ON "BidParticipant"("bidId", "userId");

-- CreateIndex
CREATE INDEX "BidEvent_bidId_idx" ON "BidEvent"("bidId");
