-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "phone" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "currency" TEXT NOT NULL DEFAULT 'JOD',
    "accountType" TEXT NOT NULL DEFAULT 'SmallBusiness',
    "logoUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("businessName", "createdAt", "currency", "email", "id", "language", "ownerName", "password", "phone") SELECT "businessName", "createdAt", "currency", "email", "id", "language", "ownerName", "password", "phone" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
