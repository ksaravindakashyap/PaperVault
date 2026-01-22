import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireProjectAccess } from "@/lib/auth";
import { z } from "zod";

const addTagSchema = z.object({
  tagName: z.string().min(1).max(50).optional(),
  tagId: z.string().cuid().optional(),
}).refine((data) => data.tagName || data.tagId, {
  message: "Either tagName or tagId must be provided",
});

// POST /api/papers/[id]/tags
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: paperId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get paper and check if it's in any projects
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

    const body = await request.json();
    const validated = addTagSchema.parse(body);

    // Get or create tag
    let tag;
    if (validated.tagId) {
      tag = await db.tag.findUnique({ where: { id: validated.tagId } });
      if (!tag) {
        return NextResponse.json({ error: "Tag not found" }, { status: 404 });
      }
    } else if (validated.tagName) {
      const normalizedName = validated.tagName.trim().toLowerCase();
      tag = await db.tag.findUnique({ where: { name: normalizedName } });
      if (!tag) {
        tag = await db.tag.create({ data: { name: normalizedName } });
      }
    } else {
      return NextResponse.json(
        { error: "Either tagName or tagId must be provided" },
        { status: 400 }
      );
    }

    // Check if already tagged
    const existing = await db.paperTag.findUnique({
      where: {
        paperId_tagId: {
          paperId,
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

    // Create PaperTag
    const paperTag = await db.paperTag.create({
      data: {
        paperId,
        tagId: tag.id,
      },
      include: {
        tag: true,
      },
    });

    // Log audit event (if paper is in a project)
    if (paper.projects.length > 0) {
      for (const pp of paper.projects) {
        await db.auditEvent.create({
          data: {
            projectId: pp.projectId,
            actorId: user.id,
            action: "TAG_ADDED",
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

    return NextResponse.json(
      {
        id: paperTag.id,
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
    console.error("Failed to add tag to paper:", error);
    return NextResponse.json(
      { error: "Failed to add tag" },
      { status: 500 }
    );
  }
}
