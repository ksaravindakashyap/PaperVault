import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, setActiveWorkspaceCookie, setUserIdCookie } from "@/lib/auth";
import { joinWorkspaceSchema } from "@/lib/validators";

// POST /api/workspaces/join
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
    const validated = joinWorkspaceSchema.parse(body);

    // Get invite
    const invite = await db.workspaceInvite.findUnique({
      where: { token: validated.token },
      include: {
        workspace: true,
      },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    // Check expiration
    const now = new Date();
    if (invite.expiresAt < now) {
      return NextResponse.json(
        { error: "Invite has expired" },
        { status: 400 }
      );
    }

    // Check if already a member (idempotent)
    const existingMember = await db.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: invite.workspaceId,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      // Already a member, just set active workspace
      await setActiveWorkspaceCookie(invite.workspaceId);
      return NextResponse.json({
        workspaceId: invite.workspaceId,
        workspaceName: invite.workspace.name,
        alreadyMember: true,
      });
    }

    // Add user as workspace member
    await db.workspaceMember.create({
      data: {
        workspaceId: invite.workspaceId,
        userId: user.id,
        role: invite.role,
      },
    });

    // Set active workspace cookie
    await setActiveWorkspaceCookie(invite.workspaceId);

    return NextResponse.json({
      workspaceId: invite.workspaceId,
      workspaceName: invite.workspace.name,
      role: invite.role,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input", details: error },
        { status: 400 }
      );
    }
    console.error("Failed to join workspace:", error);
    return NextResponse.json(
      { error: "Failed to join workspace" },
      { status: 500 }
    );
  }
}
