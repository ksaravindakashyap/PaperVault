import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireProjectAccess, setUserIdCookie } from "@/lib/auth";
import { z } from "zod";

const ProjectRoleEnum = z.enum(["OWNER", "EDITOR", "COMMENTER"]);

const updateMemberSchema = z.object({
  role: ProjectRoleEnum,
});

// PATCH /api/projects/[id]/members/[memberId]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const { id, memberId } = await params;
  const user = await getCurrentUser();

  const access = await requireProjectAccess(id, user?.id || null, "OWNER");
  if (!access.allowed) {
    return NextResponse.json({ error: access.error }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validated = updateMemberSchema.parse(body);

    // Get member to update
    const member = await db.projectMember.findUnique({
      where: { id: memberId },
      include: {
        user: true,
      },
    });

    if (!member || member.projectId !== id) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Prevent changing owner role if it's the only owner
    if (member.role === "OWNER" && validated.role !== "OWNER") {
      const ownerCount = await db.projectMember.count({
        where: {
          projectId: id,
          role: "OWNER",
        },
      });

      if (ownerCount === 1) {
        return NextResponse.json(
          { error: "Cannot remove the only owner" },
          { status: 400 }
        );
      }
    }

    const oldRole = member.role;

    // Update member
    const updated = await db.projectMember.update({
      where: { id: memberId },
      data: { role: validated.role },
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
        action: "MEMBER_ROLE_CHANGED",
        metadata: JSON.stringify({
          userId: member.userId,
          userName: member.user.name,
          oldRole,
          newRole: validated.role,
        }),
      },
    });

    return NextResponse.json({
      id: updated.id,
      userId: updated.userId,
      userName: updated.user.name,
      role: updated.role,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Failed to update member:", error);
    return NextResponse.json(
      { error: "Failed to update member" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/members/[memberId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const { id, memberId } = await params;
  
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

  const access = await requireProjectAccess(id, user?.id || null, "OWNER");
  if (!access.allowed) {
    return NextResponse.json({ error: access.error }, { status: 403 });
  }

  try {
    // Get member to delete
    const member = await db.projectMember.findUnique({
      where: { id: memberId },
      include: {
        user: true,
      },
    });

    if (!member || member.projectId !== id) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Prevent removing the only owner
    if (member.role === "OWNER") {
      const ownerCount = await db.projectMember.count({
        where: {
          projectId: id,
          role: "OWNER",
        },
      });

      if (ownerCount === 1) {
        return NextResponse.json(
          { error: "Cannot remove the only owner" },
          { status: 400 }
        );
      }
    }

    // Delete member
    await db.projectMember.delete({
      where: { id: memberId },
    });

    // Log audit event
    await db.auditEvent.create({
      data: {
        projectId: id,
        actorId: user!.id,
        action: "MEMBER_REMOVED",
        metadata: JSON.stringify({
          userId: member.userId,
          userName: member.user.name,
          role: member.role,
        }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove member:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}
