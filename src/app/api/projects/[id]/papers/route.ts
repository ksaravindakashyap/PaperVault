import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireProjectAccess, requireActiveWorkspaceId, setUserIdCookie } from "@/lib/auth";
import { addPaperToProjectSchema } from "@/lib/validators";

// POST /api/projects/[id]/papers - Add paper to project
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  // Get or create local user
  let user = await getCurrentUser();
  if (!user) {
    user = await db.user.create({
      data: {
        name: "Local User",
      },
    });
    await setUserIdCookie(user.id);
  }

  const access = await requireProjectAccess(id, user.id, "EDITOR");
  if (!access.allowed) {
    return NextResponse.json({ error: access.error }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validated = addPaperToProjectSchema.parse(body);

    const workspaceId = await requireActiveWorkspaceId();

    // Check if project exists and is in active workspace
    const project = await db.project.findUnique({
      where: { 
        id,
        workspaceId: workspaceId,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if paper exists and is in active workspace
    const paper = await db.paper.findUnique({
      where: { 
        id: validated.paperId,
        workspaceId: workspaceId,
      },
    });

    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    // Add paper to project (idempotent)
    const projectPaper = await db.projectPaper.upsert({
      where: {
        projectId_paperId: {
          projectId: id,
          paperId: validated.paperId,
        },
      },
      create: {
        projectId: id,
        paperId: validated.paperId,
      },
      update: {},
    });

    // Update project updatedAt
    await db.project.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(projectPaper, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input", details: error }, { status: 400 });
    }
    console.error("Failed to add paper to project:", error);
    return NextResponse.json({ error: "Failed to add paper to project" }, { status: 500 });
  }
}
