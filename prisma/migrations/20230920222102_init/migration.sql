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
    "Instructor" INTEGER NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "timeOfDay" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TrainingSession" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "instructor" INTEGER NOT NULL,
    "student" INTEGER,
    "start" TEXT NOT NULL,
    "end" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserBlocklist" (
    "cid" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT NOT NULL
);
