import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireActiveWorkspaceId, setUserIdCookie } from "@/lib/auth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
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

    const { id } = await context.params;
    const workspaceId = await requireActiveWorkspaceId();

    // Look up paper and citations
    const paper = await db.paper.findUnique({
      where: { 
        id,
        workspaceId: workspaceId,
      },
      include: {
        citations: {
          where: {
            workspaceId: workspaceId,
          },
          orderBy: [{ year: "desc" }, { title: "asc" }],
        },
      },
    });

    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    return NextResponse.json({
      status: paper.citationsStatus,
      count: paper.citationsCount,
      extractedAt: paper.citationsExtractedAt,
      error: paper.citationsError,
      citations: paper.citations,
    });
  } catch (error) {
    console.error("Citations fetch error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
