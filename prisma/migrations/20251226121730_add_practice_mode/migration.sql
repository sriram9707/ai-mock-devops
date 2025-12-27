-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_InterviewSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "packId" TEXT NOT NULL,
    "jdRaw" TEXT,
    "jdParsed" TEXT,
    "isPractice" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL,
    "startedAt" DATETIME,
    "endedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InterviewSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InterviewSession_packId_fkey" FOREIGN KEY ("packId") REFERENCES "InterviewPack" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_InterviewSession" ("createdAt", "endedAt", "id", "jdParsed", "jdRaw", "packId", "startedAt", "status", "updatedAt", "userId") SELECT "createdAt", "endedAt", "id", "jdParsed", "jdRaw", "packId", "startedAt", "status", "updatedAt", "userId" FROM "InterviewSession";
DROP TABLE "InterviewSession";
ALTER TABLE "new_InterviewSession" RENAME TO "InterviewSession";
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "packId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "attemptsTotal" INTEGER NOT NULL DEFAULT 3,
    "attemptsUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_packId_fkey" FOREIGN KEY ("packId") REFERENCES "InterviewPack" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("amount", "createdAt", "id", "packId", "status", "userId") SELECT "amount", "createdAt", "id", "packId", "status", "userId" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
