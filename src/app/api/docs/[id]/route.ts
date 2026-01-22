import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireProjectAccess } from "@/lib/auth";
import { z } from "zod";

const updateDocSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.string().optional(),
});

// GET /api/docs/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();

  try {
    const doc = await db.doc.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        paper: {
          select: {
            id: true,
            title: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!doc) {
      return NextResponse.json({ error: "Doc not found" }, { status: 404 });
    }

    // Check access
    const access = await requireProjectAccess(doc.projectId, user?.id || null);
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: 403 });
    }

    return NextResponse.json({
      id: doc.id,
      title: doc.title,
      content: doc.content,
      projectId: doc.projectId,
      project: doc.project,
      paperId: doc.paperId,
      paper: doc.paper,
      createdBy: doc.createdBy,
      updatedBy: doc.updatedBy,
      comments: doc.comments.map((c) => ({
        id: c.id,
        body: c.body,
        authorId: c.authorId,
        authorName: c.author.name,
        anchorStart: c.anchorStart,
        anchorEnd: c.anchorEnd,
        createdAt: c.createdAt.toISOString(),
      })),
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Failed to fetch doc:", error);
    return NextResponse.json(
      { error: "Failed to fetch doc" },
      { status: 500 }
    );
  }
}

// PATCH /api/docs/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();

  try {
    const doc = await db.doc.findUnique({
      where: { id },
    });

    if (!doc) {
      return NextResponse.json({ error: "Doc not found" }, { status: 404 });
    }

    // Check access (EDITOR or OWNER)
    const access = await requireProjectAccess(
      doc.projectId,
      user?.id || null,
      "EDITOR"
    );
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: 403 });
    }

    const body = await request.json();
    const validated = updateDocSchema.parse(body);

    // Update doc
    const updated = await db.doc.update({
      where: { id },
      data: {
        ...(validated.title && { title: validated.title }),
        ...(validated.content !== undefined && { content: validated.content }),
        updatedBy: user!.id,
      },
      include: {
        paper: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Log audit event
    await db.auditEvent.create({
      data: {
        projectId: doc.projectId,
        docId: doc.id,
        actorId: user!.id,
        action: "DOC_UPDATED",
        metadata: JSON.stringify({
          titleChanged: !!validated.title,
          contentChanged: validated.content !== undefined,
        }),
      },
    });

    return NextResponse.json({
      id: updated.id,
      title: updated.title,
      content: updated.content,
      paperId: updated.paperId,
      paper: updated.paper,
      updatedBy: updated.updatedBy,
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Failed to update doc:", error);
    return NextResponse.json(
      { error: "Failed to update doc" },
      { status: 500 }
    );
  }
}
