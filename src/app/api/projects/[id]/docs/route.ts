import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireProjectAccess, requireActiveWorkspaceId, setUserIdCookie } from "@/lib/auth";
import { z } from "zod";

const createDocSchema = z.object({
  title: z.string().min(1, "Title is required").max(500, "Title must be less than 500 characters"),
  content: z.string(),
  paperId: z.string().cuid().optional(),
});

// GET /api/projects/[id]/docs
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();

  const access = await requireProjectAccess(id, user?.id || null);
  if (!access.allowed) {
    return NextResponse.json({ error: access.error }, { status: 403 });
  }

  try {
    const docs = await db.doc.findMany({
      where: { projectId: id },
      include: {
        paper: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(
      docs.map((doc) => ({
        id: doc.id,
        title: doc.title,
        paperId: doc.paperId,
        paper: doc.paper
          ? {
              id: doc.paper.id,
              title: doc.paper.title,
            }
          : null,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error("Failed to fetch docs:", error);
    return NextResponse.json(
      { error: "Failed to fetch docs" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/docs
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
    const validated = createDocSchema.parse(body);

    // If paperId provided, verify it exists and is in project
    if (validated.paperId) {
      const paperInProject = await db.projectPaper.findUnique({
        where: {
          projectId_paperId: {
            projectId: id,
            paperId: validated.paperId,
          },
        },
      });

      if (!paperInProject) {
        return NextResponse.json(
          { error: "Paper not found in project" },
          { status: 404 }
        );
      }
    }

    // Get workspaceId from project
    const project = await db.project.findUnique({
      where: { id },
      select: { workspaceId: true },
    });

    if (!project || !project.workspaceId) {
      return NextResponse.json(
        { error: "Project not found or has no workspace" },
        { status: 404 }
      );
    }

    // Create doc
    const doc = await db.doc.create({
      data: {
        workspaceId: project.workspaceId,
        projectId: id,
        paperId: validated.paperId || null,
        title: validated.title,
        content: validated.content,
        createdBy: user!.id,
        updatedBy: user!.id,
      },
      include: {
        paper: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Log audit event
    await db.auditEvent.create({
      data: {
        projectId: id,
        docId: doc.id,
        actorId: user!.id,
        action: "DOC_CREATED",
        metadata: JSON.stringify({
          title: doc.title,
          paperId: doc.paperId,
        }),
      },
    });

    return NextResponse.json(
      {
        id: doc.id,
        title: doc.title,
        content: doc.content,
        paperId: doc.paperId,
        paper: doc.paper,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Failed to create doc:", error);
    return NextResponse.json(
      { error: "Failed to create doc" },
      { status: 500 }
    );
  }
}
