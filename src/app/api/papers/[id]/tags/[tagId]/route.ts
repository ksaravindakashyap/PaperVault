import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// DELETE /api/papers/[id]/tags/[tagId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; tagId: string }> }
) {
  const { id: paperId, tagId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get paper and check access
    const paper = await db.paper.findUnique({
      where: { id: paperId },
      include: {
        projects: {
          include: {
            project: {
              include: {
                members: {
                  where: { userId: user.id },
                },
              },
            },
          },
        },
      },
    });

    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    // If paper is in projects, require EDITOR/OWNER role
    if (paper.projects.length > 0) {
      const hasEditAccess = paper.projects.some(
        (pp) =>
          pp.project.members.length > 0 &&
          (pp.project.members[0].role === "EDITOR" ||
            pp.project.members[0].role === "OWNER")
      );

      if (!hasEditAccess) {
        return NextResponse.json(
          { error: "Insufficient permissions. EDITOR or OWNER role required." },
          { status: 403 }
        );
      }
    }

    // Get tag info before deletion
    const tag = await db.tag.findUnique({ where: { id: tagId } });
    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    // Delete PaperTag
    await db.paperTag.delete({
      where: {
        paperId_tagId: {
          paperId,
          tagId,
        },
      },
    });

    // Log audit event (if paper is in a project)
    if (paper.projects.length > 0) {
      for (const pp of paper.projects) {
        await db.auditEvent.create({
          data: {
            projectId: pp.projectId,
            actorId: user.id,
            action: "TAG_REMOVED",
            metadata: JSON.stringify({
              entityType: "paper",
              entityId: paperId,
              tagId: tag.id,
              tagName: tag.name,
            }),
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove tag from paper:", error);
    return NextResponse.json(
      { error: "Failed to remove tag" },
      { status: 500 }
    );
  }
}
