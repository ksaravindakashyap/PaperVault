import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireProjectAccess } from "@/lib/auth";

// DELETE /api/projects/[id]/papers/[paperId] - Remove paper from project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; paperId: string }> }
) {
  const { id, paperId } = await params;
  const user = await getCurrentUser();

  const access = await requireProjectAccess(id, user?.id || null, "EDITOR");
  if (!access.allowed) {
    return NextResponse.json({ error: access.error }, { status: 403 });
  }

  try {
    await db.projectPaper.delete({
      where: {
        projectId_paperId: {
          projectId: id,
          paperId: paperId,
        },
      },
    });

    // Update project updatedAt
    await db.project.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Record to delete does not exist")) {
      return NextResponse.json({ error: "Paper not in project" }, { status: 404 });
    }
    console.error("Failed to remove paper from project:", error);
    return NextResponse.json({ error: "Failed to remove paper from project" }, { status: 500 });
  }
}
