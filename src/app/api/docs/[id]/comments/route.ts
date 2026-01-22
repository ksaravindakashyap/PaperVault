import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireProjectAccess, setUserIdCookie } from "@/lib/auth";
import { z } from "zod";

const createCommentSchema = z.object({
  body: z.string().min(1, "Comment body is required").max(5000, "Comment must be less than 5000 characters"),
  anchorStart: z.number().int().optional(),
  anchorEnd: z.number().int().optional(),
});

// GET /api/docs/[id]/comments
export async function GET(
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

  try {
    const doc = await db.doc.findUnique({
      where: { id },
    });

    if (!doc) {
      return NextResponse.json({ error: "Doc not found" }, { status: 404 });
    }

    // Check access
    const access = await requireProjectAccess(doc.projectId, user.id);
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: 403 });
    }

    const comments = await db.comment.findMany({
      where: { docId: id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(
      comments.map((c) => ({
        id: c.id,
        body: c.body,
        authorId: c.authorId,
        authorName: c.author.name,
        anchorStart: c.anchorStart,
        anchorEnd: c.anchorEnd,
        createdAt: c.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error("Failed to fetch comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST /api/docs/[id]/comments
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

  try {
    const doc = await db.doc.findUnique({
      where: { id },
    });

    if (!doc) {
      return NextResponse.json({ error: "Doc not found" }, { status: 404 });
    }

    // Check access (any member can comment)
    const access = await requireProjectAccess(doc.projectId, user.id);
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: 403 });
    }

    const body = await request.json();
    const validated = createCommentSchema.parse(body);

    // Create comment
    const comment = await db.comment.create({
      data: {
        docId: id,
        authorId: user.id,
        body: validated.body,
        anchorStart: validated.anchorStart || null,
        anchorEnd: validated.anchorEnd || null,
      },
      include: {
        author: {
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
        projectId: doc.projectId,
        docId: doc.id,
        actorId: user.id,
        action: "COMMENT_ADDED",
        metadata: JSON.stringify({
          commentId: comment.id,
        }),
      },
    });

    return NextResponse.json(
      {
        id: comment.id,
        body: comment.body,
        authorId: comment.authorId,
        authorName: comment.author.name,
        anchorStart: comment.anchorStart,
        anchorEnd: comment.anchorEnd,
        createdAt: comment.createdAt.toISOString(),
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
    console.error("Failed to create comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
