import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    // Look up paper and citations
    const paper = await db.paper.findUnique({
      where: { id },
      include: {
        citations: {
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
