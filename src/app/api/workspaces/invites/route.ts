import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireWorkspaceAccess, setUserIdCookie } from "@/lib/auth";
import { createWorkspaceInviteSchema } from "@/lib/validators";
import { randomBytes } from "crypto";

// POST /api/workspaces/invites
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
    const validated = createWorkspaceInviteSchema.parse(body);

    // Check access (OWNER or ADMIN)
    const access = await requireWorkspaceAccess(
      validated.workspaceId,
      user.id,
      "ADMIN"
    );
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: 403 });
    }

    // Generate unique token
    const token = randomBytes(32).toString("hex");

    // Calculate expiration
    const expiresInDays = validated.expiresInDays || 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Create invite
    const invite = await db.workspaceInvite.create({
      data: {
        token,
        workspaceId: validated.workspaceId,
        role: validated.role || "MEMBER",
        expiresAt,
        createdById: user.id,
      },
      include: {
        workspace: {
          select: {
            name: true,
          },
        },
      },
    });

    // Generate shareable URL
    const origin = request.headers.get("origin") || request.url.split("/api")[0];
    const inviteUrl = `${origin}/onboarding?token=${token}`;

    return NextResponse.json(
      {
        id: invite.id,
        token: invite.token,
        inviteUrl,
        role: invite.role,
        expiresAt: invite.expiresAt.toISOString(),
        workspaceName: invite.workspace.name,
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
    console.error("Failed to create workspace invite:", error);
    return NextResponse.json(
      { error: "Failed to create workspace invite" },
      { status: 500 }
    );
  }
}
