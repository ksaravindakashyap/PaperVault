import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireProjectAccess } from "@/lib/auth";
import { z } from "zod";

const ProjectRoleEnum = z.enum(["OWNER", "EDITOR", "COMMENTER"]);

const addMemberSchema = z.object({
  userId: z.string().cuid(),
  role: ProjectRoleEnum,
});

// GET /api/projects/[id]/members
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();

  const access = await requireProjectAccess(id, user?.id || null);
  if (!access.allowed) {
    return NextResponse.json({ error: access.error }, { status: 403 });
  }

  try {
    const members = await db.projectMember.findMany({
      where: { projectId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { role: "desc" }, // OWNER first
        { createdAt: "asc" },
      ],
    });

    return NextResponse.json(
      members.map((m) => ({
        id: m.id,
        userId: m.userId,
        userName: m.user.name,
        role: m.role,
        createdAt: m.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error("Failed to fetch members:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/members
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();

  const access = await requireProjectAccess(id, user?.id || null, "OWNER");
  if (!access.allowed) {
    return NextResponse.json({ error: access.error }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validated = addMemberSchema.parse(body);

    // Check if user exists
    const targetUser = await db.user.findUnique({
      where: { id: validated.userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if already a member
    const existing = await db.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: id,
          userId: validated.userId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "User is already a member" },
        { status: 400 }
      );
    }

    // Add member
    const member = await db.projectMember.create({
      data: {
        projectId: id,
        userId: validated.userId,
        role: validated.role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Log audit event
    await db.auditEvent.create({
      data: {
        projectId: id,
        actorId: user!.id,
        action: "MEMBER_ADDED",
        metadata: JSON.stringify({
          userId: validated.userId,
          userName: targetUser.name,
          role: validated.role,
        }),
      },
    });

    return NextResponse.json(
      {
        id: member.id,
        userId: member.userId,
        userName: member.user.name,
        role: member.role,
        createdAt: member.createdAt.toISOString(),
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
    console.error("Failed to add member:", error);
    return NextResponse.json(
      { error: "Failed to add member" },
      { status: 500 }
    );
  }
}
