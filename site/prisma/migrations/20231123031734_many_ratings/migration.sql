-- This migration is destructive.

-- RedefineTables
PRAGMA foreign_keys=OFF;
DROP TABLE "TrainerRating";
CREATE TABLE "TrainerRating" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cid" INTEGER NOT NULL,
    "position" TEXT NOT NULL,
    "rated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
