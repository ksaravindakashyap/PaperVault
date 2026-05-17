import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireActiveWorkspaceId } from "@/lib/auth";
import { generateEmbedding } from "@/lib/embeddings";
import { findResearchGaps, GapPaper } from "@/lib/agentic/llm";
import { searchPapers } from "@/lib/agentic/semanticScholar";

export async function POST(request: NextRequest) {
  try {
    const workspaceId = await requireActiveWorkspaceId();
    const { focus } = await request.json();

    if (!focus || focus.trim().length < 10) {
      return NextResponse.json({ error: "Describe your research focus (at least 10 chars)" }, { status: 400 });
    }

    // 1. Embed the focus query
    const queryVec = await generateEmbedding(focus.trim(), "query");
    const vecLiteral = `[${queryVec.join(",")}]`;

    // 2. Find user's most relevant library papers via cosine similarity
    const libraryRows = await db.$queryRaw<Array<{
      id: string; title: string | null; authors: string | null;
      year: number | null; abstract: string | null; venueType: string;
    }>>`
      SELECT id, title, authors, year, abstract, "venueType"
      FROM "Paper"
      WHERE "workspaceId" = ${workspaceId}
        AND embedding IS NOT NULL
      ORDER BY embedding <=> ${vecLiteral}::vector
      LIMIT 8
    `;

    // 3. Search Semantic Scholar for fresh external papers
    let s2Papers: Awaited<ReturnType<typeof searchPapers>> = [];
    try {
      s2Papers = await searchPapers([focus.trim()], { limit: 20 });
    } catch { /* use cache only */ }

    // 4. Filter out papers already in the library (by arxivId, doi, or title match)
    const libraryArxivIds = new Set(
      (await db.paper.findMany({ where: { workspaceId }, select: { arxivId: true } }))
        .map((p) => p.arxivId).filter(Boolean)
    );
    const libraryDois = new Set(
      (await db.paper.findMany({ where: { workspaceId }, select: { doi: true } }))
        .map((p) => p.doi).filter(Boolean)
    );
    const libraryTitles = new Set(
      libraryRows.map((p) => p.title?.toLowerCase().trim()).filter(Boolean)
    );

    const externalPapers: GapPaper[] = s2Papers
      .filter((p) => {
        if (p.externalIds?.ArXiv && libraryArxivIds.has(p.externalIds.ArXiv)) return false;
        if (p.externalIds?.DOI && libraryDois.has(p.externalIds.DOI)) return false;
        if (libraryTitles.has(p.title?.toLowerCase().trim())) return false;
        return true;
      })
      .slice(0, 12)
      .map((p) => ({
        title: p.title,
        authors: JSON.stringify(p.authors),
        year: p.year ?? null,
        abstract: p.abstract ?? null,
        venue: p.venue ?? null,
      }));

    const libraryPapers: GapPaper[] = libraryRows.map((p) => ({
      title: p.title ?? "Untitled",
      authors: p.authors,
      year: p.year,
      abstract: p.abstract,
      venue: p.venueType,
    }));

    // 5. Run LLM gap analysis
    const gaps = await findResearchGaps(focus.trim(), libraryPapers, externalPapers);

    // 6. Attach full paper data to each gap
    const gapsWithPapers = gaps.map((gap) => ({
      ...gap,
      papers: gap.paperIndices
        .map((idx) => {
          const offset = libraryRows.length;
          const ep = externalPapers[idx - offset];
          if (!ep) return null;
          const s2 = s2Papers.find((p) => p.title === ep.title);
          return {
            title: ep.title,
            year: ep.year,
            venue: ep.venue,
            arxivId: s2?.externalIds?.ArXiv ?? null,
            doi: s2?.externalIds?.DOI ?? null,
            s2Id: s2?.paperId ?? null,
            abstract: ep.abstract,
          };
        })
        .filter(Boolean),
    }));

    return NextResponse.json({ gaps: gapsWithPapers, libraryPapersUsed: libraryRows.length, externalPapersUsed: externalPapers.length });
  } catch (error) {
    console.error("Gap analysis failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gap analysis failed" },
      { status: 500 }
    );
  }
}
