import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, getActiveWorkspaceId, setUserIdCookie, requireActiveWorkspace } from "@/lib/auth";

// GET /api/workspaces/current
export async function GET(request: NextRequest) {
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

  // Ensure user has a workspace
  const workspaceResult = await requireActiveWorkspace();
  if (!workspaceResult.hasWorkspace) {
    return NextResponse.json({ workspace: null });
  }

  const activeWorkspaceId = await getActiveWorkspaceId();
  if (!activeWorkspaceId) {
    return NextResponse.json({ workspace: null });
  }

  try {
    const workspace = await db.workspace.findUnique({
      where: { id: activeWorkspaceId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!workspace) {
      return NextResponse.json({ workspace: null });
    }

    return NextResponse.json({ workspace });
  } catch (error) {
    console.error("Failed to get current workspace:", error);
    return NextResponse.json(
      { error: "Failed to get current workspace" },
      { status: 500 }
    );
  }
}
