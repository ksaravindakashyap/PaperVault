import { db } from "@/lib/db";

export interface SimilarPaper {
  id: string;
  title: string | null;
  year: number | null;
  venueType: string;
  authors: string | null;
  similarity: number;
}

/**
 * Find top-K papers semantically similar to the given paper using pgvector cosine distance.
 * Returns empty array if the paper has no embedding yet.
 */
export async function findSimilarPapers(
  paperId: string,
  workspaceId: string,
  topK: number = 8
): Promise<SimilarPaper[]> {
  const paper = await db.paper.findUnique({
    where: { id: paperId },
    select: { id: true },
  });

  if (!paper) return [];

  // Use raw SQL — Prisma doesn't support Unsupported() fields in select
  const rows = await db.$queryRaw<
    Array<{
      id: string;
      title: string | null;
      year: number | null;
      venueType: string;
      authors: string | null;
      similarity: number;
    }>
  >`
    SELECT
      p.id,
      p.title,
      p.year,
      p."venueType",
      p.authors,
      1 - (p.embedding <=> src.embedding) AS similarity
    FROM "Paper" p
    CROSS JOIN (
      SELECT embedding FROM "Paper" WHERE id = ${paperId}
    ) src
    WHERE p."workspaceId" = ${workspaceId}
      AND p.id != ${paperId}
      AND p.embedding IS NOT NULL
      AND src.embedding IS NOT NULL
    ORDER BY p.embedding <=> src.embedding
    LIMIT ${topK}
  `;

  return rows.map((r) => ({ ...r, similarity: Number(r.similarity) }));
}

/**
 * Find semantically similar ExternalPapers for a given query embedding.
 */
export async function findSimilarExternalPapers(
  queryEmbedding: number[],
  topK: number = 20
): Promise<
  Array<{
    id: string;
    title: string;
    year: number | null;
    venue: string | null;
    authors: string;
    abstract: string | null;
    citationCount: number | null;
    similarity: number;
  }>
> {
  const vec = `[${queryEmbedding.join(",")}]`;
  const rows = await db.$queryRaw<
    Array<{
      id: string;
      title: string;
      year: number | null;
      venue: string | null;
      authors: string;
      abstract: string | null;
      citationCount: number | null;
      similarity: number;
    }>
  >`
    SELECT
      id,
      title,
      year,
      venue,
      authors,
      abstract,
      "citationCount",
      1 - (embedding <=> ${vec}::vector) AS similarity
    FROM "ExternalPaper"
    WHERE embedding IS NOT NULL
    ORDER BY embedding <=> ${vec}::vector
    LIMIT ${topK}
  `;

  return rows.map((r) => ({ ...r, similarity: Number(r.similarity) }));
}
