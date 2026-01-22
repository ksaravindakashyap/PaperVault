import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/invites/[token]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const invite = await db.projectInvite.findUnique({
      where: { token },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    // Check expiration
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invite has expired" }, { status: 410 });
    }

    return NextResponse.json({
      id: invite.id,
      project: {
        id: invite.project.id,
        name: invite.project.name,
        description: invite.project.description,
      },
      role: invite.role,
      expiresAt: invite.expiresAt?.toISOString() || null,
    });
  } catch (error) {
    console.error("Failed to fetch invite:", error);
    return NextResponse.json(
      { error: "Failed to fetch invite" },
      { status: 500 }
    );
  }
}
