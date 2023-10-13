-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserPreference" (
    "cid" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "receiveEmails" BOOLEAN NOT NULL DEFAULT false,
    "receiveDiscordMessages" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_UserPreference" ("cid", "receiveDiscordMessages", "receiveEmails") SELECT "cid", "receiveDiscordMessages", "receiveEmails" FROM "UserPreference";
DROP TABLE "UserPreference";
ALTER TABLE "new_UserPreference" RENAME TO "UserPreference";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
