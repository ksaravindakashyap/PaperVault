import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, setActiveWorkspaceCookie, setUserIdCookie } from "@/lib/auth";
import { createWorkspaceSchema } from "@/lib/validators";

// GET /api/workspaces - List all workspaces
export async function GET() {
  try {
    // Get or create local user
    let user = await getCurrentUser();
    if (!user) {
      // Create a default local user
      user = await db.user.create({
        data: {
          name: "Local User",
        },
      });
      await setUserIdCookie(user.id);
    }

    const memberships = await db.workspaceMember.findMany({
      where: { userId: user.id },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const workspaces = memberships.map((m) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      role: m.role,
      joinedAt: m.createdAt.toISOString(),
    }));

    return NextResponse.json({ workspaces });
  } catch (error) {
    console.error("Failed to list workspaces:", error);
    return NextResponse.json(
      { error: "Failed to list workspaces" },
      { status: 500 }
    );
  }
}

// POST /api/workspaces
export async function POST(request: NextRequest) {
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

  try {
    const body = await request.json();
    const validated = createWorkspaceSchema.parse(body);

    // Create workspace
    const workspace = await db.workspace.create({
      data: {
        name: validated.name,
        members: {
          create: {
            userId: user.id,
            role: "OWNER",
          },
        },
      },
    });

    // Set active workspace cookie
    await setActiveWorkspaceCookie(workspace.id);

    return NextResponse.json(
      {
        id: workspace.id,
        name: workspace.name,
        createdAt: workspace.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input", details: error },
        { status: 400 }
      );
    }
    console.error("Failed to create workspace:", error);
    return NextResponse.json(
      { error: "Failed to create workspace" },
      { status: 500 }
    );
  }
}
