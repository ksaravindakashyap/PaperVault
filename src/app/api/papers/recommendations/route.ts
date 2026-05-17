import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireActiveWorkspaceId } from "@/lib/auth";

type RecommendationRow = {
  id: string;
  title: string | null;
  authors: string | null;
  year: number | null;
  venueType: string;
  fileKey: string;
  arxivId: string | null;
  doi: string | null;
  similarity: number;
};

async function queryRecommendations(
  workspaceId: string,
  signalStatuses: string[],
  topK: number
): Promise<RecommendationRow[]> {
  // Build a centroid from signal papers, then rank TO_READ candidates by cosine similarity
  const statusList = signalStatuses.map((s) => `'${s}'`).join(", ");

  const rows = await db.$queryRawUnsafe<RecommendationRow[]>(`
    WITH signal AS (
      SELECT embedding
      FROM "Paper"
      WHERE "workspaceId" = $1
        AND status IN (${statusList})
        AND embedding IS NOT NULL
      LIMIT 30
    ),
    centroid AS (
      SELECT avg(embedding)::vector AS vec FROM signal
    )
    SELECT
      p.id,
      p.title,
      p.authors,
      p.year,
      p."venueType",
      p."fileKey",
      p."arxivId",
      p.doi,
      (1 - (p.embedding <=> c.vec))::float AS similarity
    FROM "Paper" p
    CROSS JOIN centroid c
    WHERE p."workspaceId" = $1
      AND p.status = 'TO_READ'
      AND p.embedding IS NOT NULL
      AND c.vec IS NOT NULL
    ORDER BY p.embedding <=> c.vec
    LIMIT $2
  `, workspaceId, topK);

  return rows.map((r) => ({ ...r, similarity: Number(r.similarity) }));
}

export async function GET() {
  try {
    const workspaceId = await requireActiveWorkspaceId();

    // Count signal papers per tier that actually have embeddings
    const counts = await db.$queryRaw<Array<{ status: string; cnt: bigint }>>`
      SELECT status, COUNT(*)::int AS cnt
      FROM "Paper"
      WHERE "workspaceId" = ${workspaceId}
        AND status IN ('DEEP_READ', 'INTEGRATED', 'SKIMMED')
        AND embedding IS NOT NULL
      GROUP BY status
    `;

    const countMap = Object.fromEntries(counts.map((c) => [c.status, Number(c.cnt)]));
    const deepCount = (countMap["DEEP_READ"] ?? 0) + (countMap["INTEGRATED"] ?? 0);
    const skimmedCount = countMap["SKIMMED"] ?? 0;

    let signalSource: "deep_reads" | "skimmed" | "none" = "none";
    let signalCount = 0;
    let recommendations: RecommendationRow[] = [];

    if (deepCount > 0) {
      signalSource = "deep_reads";
      signalCount = deepCount;
      recommendations = await queryRecommendations(workspaceId, ["DEEP_READ", "INTEGRATED"], 5);
    } else if (skimmedCount > 0) {
      signalSource = "skimmed";
      signalCount = skimmedCount;
      recommendations = await queryRecommendations(workspaceId, ["SKIMMED"], 5);
    }

    const [{ cnt: candidateCount }] = await db.$queryRaw<Array<{ cnt: bigint }>>`
      SELECT COUNT(*)::int AS cnt FROM "Paper"
      WHERE "workspaceId" = ${workspaceId}
        AND status = 'TO_READ'
        AND embedding IS NOT NULL
    `;

    // Fallback: if no embeddings exist yet, return the 5 most recently added TO_READ papers
    const fallback = recommendations.length === 0 && Number(candidateCount) === 0;
    const fallbackPapers = fallback
      ? await db.paper.findMany({
          where: { workspaceId, status: "TO_READ" },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, title: true, authors: true, year: true, venueType: true, fileKey: true, arxivId: true, doi: true },
        })
      : [];

    return NextResponse.json({
      recommendations: recommendations.length > 0 ? recommendations : fallbackPapers.map((p) => ({ ...p, similarity: null })),
      signalSource,
      signalCount,
      candidateCount: Number(candidateCount),
      fallback,
    });
  } catch (error) {
    console.error("Recommendations failed:", error);
    return NextResponse.json({ error: "Failed to load recommendations" }, { status: 500 });
  }
}
