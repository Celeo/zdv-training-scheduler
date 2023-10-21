/*
  Warnings:

  - You are about to drop the `TeacherRating` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `instructor` on the `TrainingSchedule` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `TrainingSession` table. All the data in the column will be lost.
  - You are about to drop the column `instructor` on the `TrainingSession` table. All the data in the column will be lost.
  - You are about to drop the column `selectedPosition` on the `TrainingSession` table. All the data in the column will be lost.
  - You are about to drop the column `time` on the `TrainingSession` table. All the data in the column will be lost.
  - Added the required column `trainer` to the `TrainingSchedule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dateTime` to the `TrainingSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trainer` to the `TrainingSession` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "TeacherRating";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "TrainerRating" (
    "cid" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "minorGround" BOOLEAN NOT NULL DEFAULT false,
    "majorGround" BOOLEAN NOT NULL DEFAULT false,
    "minorTower" BOOLEAN NOT NULL DEFAULT false,
    "majorTower" BOOLEAN NOT NULL DEFAULT false,
    "minorApproach" BOOLEAN NOT NULL DEFAULT false,
    "majorApproach" BOOLEAN NOT NULL DEFAULT false,
    "center" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TrainingSchedule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trainer" INTEGER NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "timeOfDay" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_TrainingSchedule" ("createdAt", "dayOfWeek", "id", "timeOfDay", "updatedAt") SELECT "createdAt", "dayOfWeek", "id", "timeOfDay", "updatedAt" FROM "TrainingSchedule";
DROP TABLE "TrainingSchedule";
ALTER TABLE "new_TrainingSchedule" RENAME TO "TrainingSchedule";
CREATE TABLE "new_TrainingSession" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "scheduleId" INTEGER,
    "trainer" INTEGER NOT NULL,
    "student" INTEGER,
    "position" TEXT,
    "dateTime" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TrainingSession_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "TrainingSchedule" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_TrainingSession" ("createdAt", "id", "notes", "scheduleId", "status", "student", "updatedAt") SELECT "createdAt", "id", "notes", "scheduleId", "status", "student", "updatedAt" FROM "TrainingSession";
DROP TABLE "TrainingSession";
ALTER TABLE "new_TrainingSession" RENAME TO "TrainingSession";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
