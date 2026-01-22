import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireProjectAccess } from "@/lib/auth";

// GET /api/projects/[id]/activity
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
    const events = await db.auditEvent.findMany({
      where: { projectId: id },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
          },
        },
        doc: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json(
      events.map((e) => ({
        id: e.id,
        action: e.action,
        actor: {
          id: e.actor.id,
          name: e.actor.name,
        },
        doc: e.doc
          ? {
              id: e.doc.id,
              title: e.doc.title,
            }
          : null,
        metadata: e.metadata ? JSON.parse(e.metadata) : null,
        createdAt: e.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error("Failed to fetch activity:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity" },
      { status: 500 }
    );
  }
}
