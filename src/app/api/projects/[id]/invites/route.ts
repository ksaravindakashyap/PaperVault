import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireProjectAccess, setUserIdCookie } from "@/lib/auth";
import { z } from "zod";
import { randomBytes } from "crypto";

const ProjectRoleEnum = z.enum(["OWNER", "EDITOR", "COMMENTER"]);

const createInviteSchema = z.object({
  role: ProjectRoleEnum,
  expiresInDays: z.number().int().min(1).max(365).optional(),
});

// POST /api/projects/[id]/invites
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
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

  const access = await requireProjectAccess(id, user.id, "OWNER");
  if (!access.allowed) {
    return NextResponse.json({ error: access.error }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validated = createInviteSchema.parse(body);

    // Generate unique token
    const token = randomBytes(32).toString("hex");

    // Calculate expiration
    const expiresAt = validated.expiresInDays
      ? new Date(Date.now() + validated.expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    // Create invite
    const invite = await db.projectInvite.create({
      data: {
        projectId: id,
        token,
        role: validated.role,
        expiresAt,
      },
    });

    // Log audit event
    await db.auditEvent.create({
      data: {
        projectId: id,
        actorId: user!.id,
        action: "INVITE_CREATED",
        metadata: JSON.stringify({
          role: validated.role,
          expiresAt: expiresAt?.toISOString() || null,
        }),
      },
    });

    // Generate invite URL
    const origin = request.headers.get("origin") || request.nextUrl.origin;
    const inviteUrl = `${origin}/invites/${token}`;

    return NextResponse.json(
      {
        id: invite.id,
        token: invite.token,
        role: invite.role,
        expiresAt: invite.expiresAt?.toISOString() || null,
        inviteUrl,
        createdAt: invite.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Failed to create invite:", error);
    return NextResponse.json(
      { error: "Failed to create invite" },
      { status: 500 }
    );
  }
}
