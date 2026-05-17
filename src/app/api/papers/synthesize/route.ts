import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireActiveWorkspaceId } from "@/lib/auth";
import { synthesizePapers } from "@/lib/agentic/llm";

export async function POST(request: NextRequest) {
  try {
    const workspaceId = await requireActiveWorkspaceId();
    const { paperIds } = await request.json();

    if (!Array.isArray(paperIds) || paperIds.length < 2 || paperIds.length > 5) {
      return NextResponse.json({ error: "Select 2–5 papers to synthesize" }, { status: 400 });
    }

    const papers = await db.paper.findMany({
      where: { id: { in: paperIds }, workspaceId },
      select: { id: true, title: true, authors: true, year: true, abstract: true },
    });

    if (papers.length < 2) {
      return NextResponse.json({ error: "Not enough papers found in your library" }, { status: 404 });
    }

    const synthesis = await synthesizePapers(
      papers.map((p) => ({
        title: p.title ?? "Untitled",
        authors: p.authors,
        year: p.year,
        abstract: p.abstract,
      }))
    );

    return NextResponse.json({
      synthesis,
      papers: papers.map((p) => ({ id: p.id, title: p.title ?? "Untitled" })),
    });
  } catch (error) {
    console.error("Synthesis failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to synthesize papers" },
      { status: 500 }
    );
  }
}
