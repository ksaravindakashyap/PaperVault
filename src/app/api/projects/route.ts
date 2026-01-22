import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireActiveWorkspaceId, setUserIdCookie } from "@/lib/auth";
import { createProjectSchema } from "@/lib/validators";

// GET /api/projects - List all projects with paper counts
export async function GET() {
  try {
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

    const workspaceId = await requireActiveWorkspaceId();

    const projects = await db.project.findMany({
      where: {
        workspaceId: workspaceId,
      },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: { papers: true },
        },
      },
    });

    return NextResponse.json(
      projects.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        paperCount: p._count.papers,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    const validated = createProjectSchema.parse(body);

    const workspaceId = await requireActiveWorkspaceId();

    // Create project and add creator as OWNER in a transaction
    const project = await db.project.create({
      data: {
        name: validated.name,
        description: validated.description,
        createdByUserId: user.id,
        workspaceId: workspaceId,
        members: {
          create: {
            userId: user.id,
            role: "OWNER",
          },
        },
      },
    });

    // Log audit event
    await db.auditEvent.create({
      data: {
        projectId: project.id,
        actorId: user.id,
        action: "PROJECT_CREATED",
        metadata: JSON.stringify({
          name: project.name,
        }),
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input", details: error }, { status: 400 });
    }
    console.error("Failed to create project:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
