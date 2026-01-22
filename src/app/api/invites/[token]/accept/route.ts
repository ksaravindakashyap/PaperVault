import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, setUserIdCookie } from "@/lib/auth";
import { z } from "zod";

const acceptInviteSchema = z.object({
  name: z.string().min(1).max(200).optional(),
});

// POST /api/invites/[token]/accept
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const body = await request.json();
    const validated = acceptInviteSchema.parse(body);

    // Get invite
    const invite = await db.projectInvite.findUnique({
      where: { token },
      include: {
        project: true,
      },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    // Check expiration
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invite has expired" }, { status: 410 });
    }

    // Get or create user
    let user = await getCurrentUser();

    if (!user) {
      // Create new user
      if (!validated.name) {
        return NextResponse.json(
          { error: "Name is required for new users" },
          { status: 400 }
        );
      }

      user = await db.user.create({
        data: {
          name: validated.name,
        },
      });

      await setUserIdCookie(user.id);
    }

    // Check if already a member
    const existing = await db.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: invite.projectId,
          userId: user.id,
        },
      },
    });

    if (existing) {
      // Already a member, just return success
      return NextResponse.json({
        projectId: invite.projectId,
        message: "Already a member",
      });
    }

    // Add as member
    await db.projectMember.create({
      data: {
        projectId: invite.projectId,
        userId: user.id,
        role: invite.role,
      },
    });

    // Log audit event
    await db.auditEvent.create({
      data: {
        projectId: invite.projectId,
        actorId: user.id,
        action: "INVITE_ACCEPTED",
        metadata: JSON.stringify({
          inviteId: invite.id,
          role: invite.role,
        }),
      },
    });

    return NextResponse.json({
      projectId: invite.projectId,
      message: "Successfully joined project",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Failed to accept invite:", error);
    return NextResponse.json(
      { error: "Failed to accept invite" },
      { status: 500 }
    );
  }
}
