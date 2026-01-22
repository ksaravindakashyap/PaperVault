import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, getActiveWorkspaceId } from "@/lib/auth";

// GET /api/workspaces/current
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
