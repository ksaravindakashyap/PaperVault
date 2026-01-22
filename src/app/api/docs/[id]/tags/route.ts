import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireProjectAccess, requireActiveWorkspaceId, setUserIdCookie } from "@/lib/auth";
import { z } from "zod";

const addTagSchema = z.object({
  tagName: z.string().min(1).max(50).optional(),
  tagId: z.string().cuid().optional(),
}).refine((data) => data.tagName || data.tagId, {
  message: "Either tagName or tagId must be provided",
});

// POST /api/docs/[id]/tags
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: docId } = await params;
  
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

    const workspaceId = await requireActiveWorkspaceId();

    // Verify doc is in active workspace
    if (doc.workspaceId !== workspaceId) {
      return NextResponse.json(
        { error: "Doc not in active workspace" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = addTagSchema.parse(body);

    // Get or create tag
    let tag;
    if (validated.tagId) {
      tag = await db.tag.findUnique({ where: { id: validated.tagId } });
      if (!tag) {
        return NextResponse.json({ error: "Tag not found" }, { status: 404 });
      }
      if (tag.workspaceId !== workspaceId) {
        return NextResponse.json(
          { error: "Tag not in active workspace" },
          { status: 403 }
        );
      }
    } else if (validated.tagName) {
      const normalizedName = validated.tagName.trim().toLowerCase();
      tag = await db.tag.findUnique({
        where: {
          workspaceId_name: {
            workspaceId: workspaceId,
            name: normalizedName,
          },
        },
      });
      if (!tag) {
        tag = await db.tag.create({
          data: { workspaceId: workspaceId, name: normalizedName },
        });
      }
    } else {
      return NextResponse.json(
        { error: "Either tagName or tagId must be provided" },
        { status: 400 }
      );
    }

    // Check if already tagged
    const existing = await db.docTag.findUnique({
      where: {
        docId_tagId: {
          docId,
          tagId: tag.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json({
        id: existing.id,
        tag: { id: tag.id, name: tag.name },
      });
    }

    // Create DocTag
    const docTag = await db.docTag.create({
      data: {
        docId,
        tagId: tag.id,
      },
      include: {
        tag: true,
      },
    });

    // Log audit event
    await db.auditEvent.create({
      data: {
        projectId: doc.projectId,
        actorId: user.id,
        action: "TAG_ADDED",
        metadata: JSON.stringify({
          entityType: "doc",
          entityId: docId,
          tagId: tag.id,
          tagName: tag.name,
        }),
      },
    });

    return NextResponse.json(
      {
        id: docTag.id,
        tag: { id: tag.id, name: tag.name },
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
    console.error("Failed to add tag to doc:", error);
    return NextResponse.json(
      { error: "Failed to add tag" },
      { status: 500 }
    );
  }
}
