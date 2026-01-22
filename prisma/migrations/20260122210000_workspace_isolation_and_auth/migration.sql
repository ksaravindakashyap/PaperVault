-- Step 1: Add workspaceId columns (skip if already exist - SQLite limitation)
-- These will fail silently if columns exist, which is fine
-- Paper
-- Project  
-- Doc
-- Todo
-- Citation
-- Tag

-- Step 2: Create a default workspace for existing data (if needed)
INSERT INTO "Workspace" ("id", "name", "createdAt", "updatedAt")
SELECT 'default-workspace-' || lower(hex(randomblob(8))), 'Default Workspace', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Workspace" WHERE "name" = 'Default Workspace');

-- Step 4: Assign existing data to default workspace
UPDATE "Paper" 
SET "workspaceId" = (SELECT "id" FROM "Workspace" WHERE "name" = 'Default Workspace' ORDER BY "createdAt" LIMIT 1)
WHERE "workspaceId" IS NULL;

UPDATE "Project" 
SET "workspaceId" = (SELECT "id" FROM "Workspace" WHERE "name" = 'Default Workspace' ORDER BY "createdAt" LIMIT 1)
WHERE "workspaceId" IS NULL;

UPDATE "Doc" 
SET "workspaceId" = (SELECT "workspaceId" FROM "Project" WHERE "Project"."id" = "Doc"."projectId" LIMIT 1)
WHERE "workspaceId" IS NULL;

UPDATE "Todo" 
SET "workspaceId" = (SELECT "workspaceId" FROM "Project" WHERE "Project"."id" = "Todo"."projectId" LIMIT 1)
WHERE "workspaceId" IS NULL;

UPDATE "Citation" 
SET "workspaceId" = (SELECT "workspaceId" FROM "Paper" WHERE "Paper"."id" = "Citation"."sourcePaperId" LIMIT 1)
WHERE "workspaceId" IS NULL;

UPDATE "Tag" 
SET "workspaceId" = (SELECT "id" FROM "Workspace" WHERE "name" = 'Default Workspace' ORDER BY "createdAt" LIMIT 1)
WHERE "workspaceId" IS NULL;

-- Step 4: Create indexes for workspaceId columns
CREATE INDEX IF NOT EXISTS "Paper_workspaceId_idx" ON "Paper"("workspaceId");
CREATE INDEX IF NOT EXISTS "Project_workspaceId_idx" ON "Project"("workspaceId");
CREATE INDEX IF NOT EXISTS "Doc_workspaceId_idx" ON "Doc"("workspaceId");
CREATE INDEX IF NOT EXISTS "Todo_workspaceId_idx" ON "Todo"("workspaceId");
CREATE INDEX IF NOT EXISTS "Citation_workspaceId_idx" ON "Citation"("workspaceId");
CREATE INDEX IF NOT EXISTS "Tag_workspaceId_idx" ON "Tag"("workspaceId");

-- Step 5: Create composite unique index for Tag (workspaceId, name)
CREATE UNIQUE INDEX IF NOT EXISTS "Tag_workspaceId_name_key" ON "Tag"("workspaceId", "name");
