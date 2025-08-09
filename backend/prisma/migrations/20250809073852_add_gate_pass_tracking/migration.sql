-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Bid" (
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
    "gatePassUploadedBy" TEXT,
    "gatePassUploadedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Bid_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Bid_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Bid_gatePassUploadedBy_fkey" FOREIGN KEY ("gatePassUploadedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Bid" ("basePrice", "createdAt", "creatorId", "currentPrice", "description", "endDate", "gatePassPath", "id", "location", "lotName", "minIncrementPercent", "quantity", "startDate", "status", "unit", "updatedAt", "wasteType", "winnerId") SELECT "basePrice", "createdAt", "creatorId", "currentPrice", "description", "endDate", "gatePassPath", "id", "location", "lotName", "minIncrementPercent", "quantity", "startDate", "status", "unit", "updatedAt", "wasteType", "winnerId" FROM "Bid";
DROP TABLE "Bid";
ALTER TABLE "new_Bid" RENAME TO "Bid";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
