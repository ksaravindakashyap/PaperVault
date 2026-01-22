import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, setActiveWorkspaceCookie } from "@/lib/auth";
import { createWorkspaceSchema } from "@/lib/validators";
import { randomBytes } from "crypto";

// POST /api/workspaces
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
