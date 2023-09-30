-- CreateTable
CREATE TABLE "UserPreferences" (
    "cid" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "receiveEmails" BOOLEAN NOT NULL DEFAULT true,
    "receiveDiscordMessages" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "DiscordMessages" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cid" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME NOT NULL
);
