import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/workspaces/invites/[token]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const invite = await db.workspaceInvite.findUnique({
      where: { token },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    const now = new Date();
    const isExpired = invite.expiresAt < now;

    return NextResponse.json({
      workspaceName: invite.workspace.name,
      workspaceId: invite.workspace.id,
      role: invite.role,
      expiresAt: invite.expiresAt.toISOString(),
      isExpired,
    });
  } catch (error) {
    console.error("Failed to fetch invite:", error);
    return NextResponse.json(
      { error: "Failed to fetch invite" },
      { status: 500 }
    );
  }
}
