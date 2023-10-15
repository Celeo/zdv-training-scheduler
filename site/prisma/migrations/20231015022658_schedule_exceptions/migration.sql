-- CreateTable
CREATE TABLE "TrainingScheduleException" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "scheduleId" INTEGER,
    "date" TEXT NOT NULL,
    CONSTRAINT "TrainingScheduleException_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "TrainingSchedule" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
