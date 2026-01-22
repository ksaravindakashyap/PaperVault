import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, getActiveWorkspaceId, setUserIdCookie } from "@/lib/auth";

// GET /api/workspaces/list
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

  try {
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

    const activeWorkspaceId = await getActiveWorkspaceId();

    const workspaces = memberships.map((m) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      role: m.role,
      isActive: m.workspace.id === activeWorkspaceId,
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
