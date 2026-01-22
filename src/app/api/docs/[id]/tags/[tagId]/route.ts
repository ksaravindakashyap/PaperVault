import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireProjectAccess, setUserIdCookie } from "@/lib/auth";

// DELETE /api/docs/[id]/tags/[tagId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; tagId: string }> }
) {
  const { id: docId, tagId } = await params;
  
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
    // Get doc and check access
    const doc = await db.doc.findUnique({
      where: { id: docId },
    });

    if (!doc) {
      return NextResponse.json({ error: "Doc not found" }, { status: 404 });
    }

    // Require EDITOR/OWNER role
    const access = await requireProjectAccess(
      doc.projectId,
      user.id,
      "EDITOR"
    );
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: 403 });
    }

    // Get tag info before deletion
    const tag = await db.tag.findUnique({ where: { id: tagId } });
    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    // Delete DocTag
    await db.docTag.delete({
      where: {
        docId_tagId: {
          docId,
          tagId,
        },
      },
    });

    // Log audit event
    await db.auditEvent.create({
      data: {
        projectId: doc.projectId,
        actorId: user.id,
        action: "TAG_REMOVED",
        metadata: JSON.stringify({
          entityType: "doc",
          entityId: docId,
          tagId: tag.id,
          tagName: tag.name,
        }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove tag from doc:", error);
    return NextResponse.json(
      { error: "Failed to remove tag" },
      { status: 500 }
    );
  }
}
