-- AlterTable
ALTER TABLE "Paper" ADD COLUMN "citationsCount" INTEGER;
ALTER TABLE "Paper" ADD COLUMN "citationsError" TEXT;
ALTER TABLE "Paper" ADD COLUMN "citationsExtractedAt" DATETIME;
ALTER TABLE "Paper" ADD COLUMN "citationsStatus" TEXT;

-- CreateTable
CREATE TABLE "Citation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourcePaperId" TEXT NOT NULL,
    "raw" TEXT NOT NULL,
    "title" TEXT,
    "authors" TEXT,
    "year" INTEGER,
    "venue" TEXT,
    "doi" TEXT,
    "arxivId" TEXT,
    "url" TEXT,
    "targetPaperId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Citation_sourcePaperId_fkey" FOREIGN KEY ("sourcePaperId") REFERENCES "Paper" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Citation_targetPaperId_fkey" FOREIGN KEY ("targetPaperId") REFERENCES "Paper" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Citation_sourcePaperId_idx" ON "Citation"("sourcePaperId");

-- CreateIndex
CREATE INDEX "Citation_doi_idx" ON "Citation"("doi");

-- CreateIndex
CREATE INDEX "Citation_arxivId_idx" ON "Citation"("arxivId");

-- CreateIndex
CREATE INDEX "Citation_title_idx" ON "Citation"("title");

-- CreateIndex
CREATE INDEX "Citation_targetPaperId_idx" ON "Citation"("targetPaperId");

-- CreateIndex
CREATE INDEX "Paper_doi_idx" ON "Paper"("doi");

-- CreateIndex
CREATE INDEX "Paper_arxivId_idx" ON "Paper"("arxivId");
