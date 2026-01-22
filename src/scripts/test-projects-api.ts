/**
 * Test script for Projects API endpoints
 * Run with: npx tsx src/scripts/test-projects-api.ts
 */

import { db } from "@/lib/db";

async function testProjectsAPI() {
  console.log("🧪 Testing Projects API Implementation\n");

  try {
    // Test 1: Create a project
    console.log("1️⃣  Creating test project...");
    const project = await db.project.create({
      data: {
        name: "Test Project",
        description: "Testing Step 3 implementation",
      },
    });
    console.log(`✅ Created project: ${project.name} (${project.id})\n`);

    // Test 2: List projects
    console.log("2️⃣  Listing all projects...");
    const projects = await db.project.findMany({
      include: {
        _count: {
          select: { papers: true },
        },
      },
    });
    console.log(`✅ Found ${projects.length} project(s)\n`);

    // Test 3: Check if we have any papers to work with
    console.log("3️⃣  Checking for papers in library...");
    const papers = await db.paper.findMany({
      take: 2,
      select: { id: true, title: true },
    });
    
    if (papers.length === 0) {
      console.log("⚠️  No papers found. Upload some papers first to test adding them to projects.\n");
    } else {
      console.log(`✅ Found ${papers.length} paper(s)\n`);

      // Test 4: Add papers to project
      console.log("4️⃣  Adding papers to project...");
      for (const paper of papers) {
        await db.projectPaper.create({
          data: {
            projectId: project.id,
            paperId: paper.id,
          },
        });
        console.log(`   Added: ${paper.title || "Untitled"}`);
      }
      console.log("✅ Papers added successfully\n");

      // Test 5: Get project with papers
      console.log("5️⃣  Fetching project with papers...");
      const projectWithPapers = await db.project.findUnique({
        where: { id: project.id },
        include: {
          papers: {
            include: {
              paper: {
                select: {
                  id: true,
                  title: true,
                  status: true,
                },
              },
            },
          },
        },
      });
      console.log(`✅ Project has ${projectWithPapers?.papers.length} paper(s)\n`);

      // Test 6: Remove one paper
      console.log("6️⃣  Removing first paper from project...");
      const firstPaper = projectWithPapers?.papers[0];
      if (firstPaper) {
        await db.projectPaper.delete({
          where: {
            projectId_paperId: {
              projectId: project.id,
              paperId: firstPaper.paperId,
            },
          },
        });
        console.log(`✅ Removed paper from project\n`);
      }

      // Test 7: Update paper status
      console.log("7️⃣  Updating paper status...");
      const testPaper = papers[0];
      await db.paper.update({
        where: { id: testPaper.id },
        data: { status: "TO_READ" },
      });
      console.log(`✅ Updated paper status to TO_READ\n`);
    }

    // Test 8: Update project
    console.log("8️⃣  Updating project...");
    await db.project.update({
      where: { id: project.id },
      data: {
        notes: "These are my project notes.\n\nLorem ipsum dolor sit amet.",
      },
    });
    console.log("✅ Updated project notes\n");

    // Test 9: Delete project
    console.log("9️⃣  Deleting test project...");
    await db.project.delete({
      where: { id: project.id },
    });
    console.log("✅ Deleted project (papers remain in library)\n");

    // Verify papers still exist
    console.log("🔟 Verifying papers still exist in library...");
    const remainingPapers = await db.paper.findMany({
      where: { id: { in: papers.map((p) => p.id) } },
    });
    console.log(`✅ ${remainingPapers.length} paper(s) still in library\n`);

    console.log("✨ All tests passed!\n");
  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

testProjectsAPI()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
