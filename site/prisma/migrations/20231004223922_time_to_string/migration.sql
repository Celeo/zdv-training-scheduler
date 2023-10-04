-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TrainingSchedule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "instructor" INTEGER NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "timeOfDay" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_TrainingSchedule" ("createdAt", "dayOfWeek", "id", "instructor", "timeOfDay", "updatedAt") SELECT "createdAt", "dayOfWeek", "id", "instructor", "timeOfDay", "updatedAt" FROM "TrainingSchedule";
DROP TABLE "TrainingSchedule";
ALTER TABLE "new_TrainingSchedule" RENAME TO "TrainingSchedule";
CREATE TABLE "new_TrainingSession" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "scheduleId" INTEGER,
    "instructor" INTEGER NOT NULL,
    "student" INTEGER,
    "selectedPosition" TEXT,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
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
