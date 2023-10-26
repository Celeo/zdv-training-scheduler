/*
  Warnings:

  - Made the column `scheduleId` on table `TrainingScheduleException` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TrainingScheduleException" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "scheduleId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    CONSTRAINT "TrainingScheduleException_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "TrainingSchedule" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TrainingScheduleException" ("date", "id", "scheduleId") SELECT "date", "id", "scheduleId" FROM "TrainingScheduleException";
DROP TABLE "TrainingScheduleException";
ALTER TABLE "new_TrainingScheduleException" RENAME TO "TrainingScheduleException";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
