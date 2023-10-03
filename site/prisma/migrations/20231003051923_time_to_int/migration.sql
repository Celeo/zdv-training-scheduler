/*
  Warnings:

  - You are about to alter the column `time` on the `TrainingSession` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TrainingSession" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "scheduleId" INTEGER,
    "instructor" INTEGER NOT NULL,
    "student" INTEGER,
    "selectedPosition" TEXT,
    "date" TEXT NOT NULL,
    "time" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TrainingSession_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "TrainingSchedule" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_TrainingSession" ("createdAt", "date", "id", "instructor", "notes", "scheduleId", "selectedPosition", "status", "student", "time", "updatedAt") SELECT "createdAt", "date", "id", "instructor", "notes", "scheduleId", "selectedPosition", "status", "student", "time", "updatedAt" FROM "TrainingSession";
DROP TABLE "TrainingSession";
ALTER TABLE "new_TrainingSession" RENAME TO "TrainingSession";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
