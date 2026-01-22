-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Paper" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileKey" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "venueType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "title" TEXT,
    "authors" TEXT,
    "year" INTEGER,
    "doi" TEXT,
    "arxivId" TEXT,
    "abstract" TEXT,
    "summary" TEXT,
    "bibtex" TEXT,
    "processingLockedAt" DATETIME,
    "processingLockedBy" TEXT,
    "processingAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastProcessingError" TEXT,
    "processedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Paper" ("abstract", "arxivId", "authors", "createdAt", "doi", "fileKey", "id", "originalFileName", "status", "summary", "title", "updatedAt", "venueType", "year") SELECT "abstract", "arxivId", "authors", "createdAt", "doi", "fileKey", "id", "originalFileName", "status", "summary", "title", "updatedAt", "venueType", "year" FROM "Paper";
DROP TABLE "Paper";
ALTER TABLE "new_Paper" RENAME TO "Paper";
CREATE INDEX "Paper_status_processingLockedAt_idx" ON "Paper"("status", "processingLockedAt");
CREATE INDEX "Paper_createdAt_idx" ON "Paper"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
