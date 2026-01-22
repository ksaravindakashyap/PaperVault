-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PaperTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paperId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    CONSTRAINT "PaperTag_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "Paper" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PaperTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DocTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "docId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    CONSTRAINT "DocTag_docId_fkey" FOREIGN KEY ("docId") REFERENCES "Doc" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DocTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "Tag_name_idx" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "PaperTag_paperId_idx" ON "PaperTag"("paperId");

-- CreateIndex
CREATE INDEX "PaperTag_tagId_idx" ON "PaperTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "PaperTag_paperId_tagId_key" ON "PaperTag"("paperId", "tagId");

-- CreateIndex
CREATE INDEX "DocTag_docId_idx" ON "DocTag"("docId");

-- CreateIndex
CREATE INDEX "DocTag_tagId_idx" ON "DocTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "DocTag_docId_tagId_key" ON "DocTag"("docId", "tagId");
