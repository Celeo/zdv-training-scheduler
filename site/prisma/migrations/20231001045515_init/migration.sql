-- CreateTable
CREATE TABLE "TeacherRating" (
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

-- CreateTable
CREATE TABLE "TrainingSchedule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "instructor" INTEGER NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "timeOfDay" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TrainingSession" (
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

-- CreateTable
CREATE TABLE "UserBlocklist" (
    "cid" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reason" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "cid" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "receiveEmails" BOOLEAN NOT NULL DEFAULT true,
    "receiveDiscordMessages" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "DiscordMessage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cid" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME
);

-- CreateTable
CREATE TABLE "Log" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "message" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
